def get_chatbot_response(client,model_name,messages,temperature=0):
    input_messages = []
    for message in messages:
        input_messages.append({"role": message["role"], "content": message["content"]})

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=input_messages,
            temperature=temperature,
            top_p=0.8,
            max_tokens=2000,
        ).choices[0].message.content
        
        return response
    except Exception as e:
        error_msg = str(e)
        if "500" in error_msg or "InternalServerError" in str(type(e).__name__):
            print(f"\n⚠️  RunPod API Error (500): The server encountered an error processing your request.")
            print(f"   This could be due to:")
            print(f"   - Invalid or expired RunPod token")
            print(f"   - Incorrect endpoint URL format")
            print(f"   - Model name mismatch with deployed model")
            print(f"   - RunPod service temporarily unavailable")
            print(f"   - Request format incompatible with your RunPod endpoint")
        elif "401" in error_msg or "Unauthorized" in error_msg:
            print(f"\n⚠️  Authentication Error: Invalid RunPod token")
        elif "404" in error_msg:
            print(f"\n⚠️  Not Found Error: Check your RunPod endpoint URL")
        else:
            print(f"\n⚠️  API Error: {error_msg}")
        raise

def get_embedding(embedding_client,model_name,text_input):
    output = embedding_client.embeddings.create(input = text_input,model=model_name)
    
    embedings = []
    for embedding_object in output.data:
        embedings.append(embedding_object.embedding)

    return embedings

def double_check_json_output(client,model_name,json_string):
    prompt = f""" You will check this json string and correct any mistakes that will make it invalid. Then you will return the corrected json string. Nothing else. 
    If the Json is correct just return it.

    Do NOT return a single letter outside of the json string.

    {json_string}
    """

    messages = [{"role": "user", "content": prompt}]

    response = get_chatbot_response(client,model_name,messages)

    return response