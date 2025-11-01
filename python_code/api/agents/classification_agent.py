from dotenv import load_dotenv
import os
import json
import re
from copy import deepcopy
from .utils import get_chatbot_response, double_check_json_output
from openai import OpenAI
load_dotenv()

class ClassificationAgent():
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("RUNPOD_TOKEN"),
            base_url=os.getenv("RUNPOD_CHATBOT_URL"),
        )
        self.model_name = os.getenv("MODEL_NAME")
    
    def get_response(self,messages):
        messages = deepcopy(messages)

        system_prompt = """
            You are a helpful AI assistant for a coffee shop application.
            Your task is to determine what agent should handle the user input. You have 3 agents to choose from:
            1. details_agent: This agent is responsible for answering questions about the coffee shop, like location, delivery places, working hours, details about menue items. Or listing items in the menu items. Or by asking what we have.
            2. order_taking_agent: This agent is responsible for taking orders from the user. It's responsible to have a conversation with the user about the order untill it's complete.
            3. recommendation_agent: This agent is responsible for giving recommendations to the user about what to buy. If the user asks for a recommendation, this agent should be used.

            Your output should be in a structured json format like so. each key is a string and each value is a string. Make sure to follow the format exactly:
            {
            "chain of thought": go over each of the agents above and write some your thoughts about what agent is this input relevant to.
            "decision": "details_agent" or "order_taking_agent" or "recommendation_agent". Pick one of those. and only write the word.
            "message": leave the message empty.
            }
            """
        
        input_messages = [
            {"role": "system", "content": system_prompt},
        ]

        input_messages += messages[-3:]

        chatbot_output =get_chatbot_response(self.client,self.model_name,input_messages)
        output = self.postprocess(chatbot_output)
        return output

    def postprocess(self,output):
        # Try to extract JSON from the output if it's wrapped in markdown code blocks
        json_str = self._extract_json(output)
        
        # Try to parse the JSON
        try:
            output = json.loads(json_str)
        except json.JSONDecodeError:
            # If parsing fails, try to fix it using the double_check_json_output function
            try:
                json_str = double_check_json_output(self.client, self.model_name, json_str)
                output = json.loads(json_str)
            except Exception as e:
                # If all else fails, return a default response
                print(f"Error parsing JSON: {e}")
                print(f"Raw output: {output}")
                output = {
                    "chain of thought": "Error parsing response",
                    "decision": "details_agent",
                    "message": ""
                }

        dict_output = {
            "role": "assistant",
            "content": output.get('message', ''),
            "memory": {"agent":"classification_agent",
                       "classification_decision": output.get('decision', 'details_agent')
                      }
        }
        return dict_output
    
    def _extract_json(self, text):
        """Extract JSON from text, handling markdown code blocks and extra text."""
        # Remove markdown code blocks if present
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            return json_match.group(1)
        
        # Try to find JSON object in the text
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json_match.group(0)
        
        # If no JSON found, return the original text
        return text.strip()

    
