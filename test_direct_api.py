import os
import requests
import json
from dotenv import load_dotenv

# .envファイルを読み込み
load_dotenv()

def test_openai_direct():
    """OpenAI APIに直接リクエストを送信してテスト"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("OpenAI API key not found in environment")
        return False
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'model': 'gpt-4o',
        'messages': [{'role': 'user', 'content': 'Hello, please respond with "API test successful"'}],
        'max_tokens': 50
    }
    
    try:
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"OpenAI Response: {result['choices'][0]['message']['content']}")
            return True
        else:
            print(f"OpenAI API Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"OpenAI API Connection Error: {e}")
        return False

def test_anthropic_direct():
    """Anthropic APIに直接リクエストを送信してテスト"""
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("Anthropic API key not found in environment")
        return False
    
    headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
    }
    
    data = {
        'model': 'claude-3-5-sonnet-20241022',
        'max_tokens': 50,
        'messages': [{'role': 'user', 'content': 'Hello, please respond with "API test successful"'}]
    }
    
    try:
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers=headers,
            json=data,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Anthropic Response: {result['content'][0]['text']}")
            return True
        else:
            print(f"Anthropic API Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Anthropic API Connection Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing direct API connections...")
    print("\n=== OpenAI API Test ===")
    openai_success = test_openai_direct()
    
    print("\n=== Anthropic API Test ===")
    anthropic_success = test_anthropic_direct()
    
    print("\n=== Summary ===")
    print(f"OpenAI API: {'✓ Success' if openai_success else '✗ Failed'}")
    print(f"Anthropic API: {'✓ Success' if anthropic_success else '✗ Failed'}")