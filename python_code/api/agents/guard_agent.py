from dotenv import load_dotenv
import os
import json
import re
from copy import deepcopy
from .utils import get_chatbot_response, double_check_json_output
from openai import OpenAI
load_dotenv()

class GuardAgent():
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("RUNPOD_TOKEN"),
            base_url=os.getenv("RUNPOD_CHATBOT_URL"),
        )
        self.model_name = os.getenv("MODEL_NAME")
    
    def get_response(self,messages):
        messages = deepcopy(messages)

        system_prompt = """
            You are a helpful AI assistant for a coffee shop application which serves drinks and pastries.
            Your task is to determine whether the user is asking something relevant to the coffee shop or not.
            The user is allowed to:
            1. Ask questions about the coffee shop, like location, working hours, menue items and coffee shop related questions.
            2. Ask questions about menue items, they can ask for ingredients in an item and more details about the item.
            3. Make an order.
            4. ASk about recommendations of what to buy.

            The user is NOT allowed to:
            1. Ask questions about anything else other than our coffee shop.
            2. Ask questions about the staff or how to make a certain menue item.

            Your output should be in a structured json format like so. each key is a string and each value is a string. Make sure to follow the format exactly:
            {
            "chain of thought": go over each of the points above and make see if the message lies under this point or not. Then you write some your thoughts about what point is this input relevant to.
            "decision": "allowed" or "not allowed". Pick one of those. and only write the word.
            "message": leave the message empty if it's allowed, otherwise write "Sorry, I can't help with that. Can I help you with your order?"
            }
            """
        
        input_messages = [{"role": "system", "content": system_prompt}] + messages[-3:]

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
                    "decision": "allowed",
                    "message": ""
                }

        dict_output = {
            "role": "assistant",
            "content": output.get('message', ''),
            "memory": {"agent":"guard_agent",
                       "guard_decision": output.get('decision', 'allowed')
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



    
