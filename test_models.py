#!/usr/bin/env python3

import os
import sys
sys.path.append('src')

from models import model_manager

def test_models():
    print("Initializing models...")
    model_manager.init_models(use_local_proxy=False)
    
    print("\nRegistered models:")
    for model_name in model_manager.registed_models.keys():
        print(f"  - {model_name}")
    
    print("\nTesting model availability...")
    
    # Test models that might work
    test_models = [
        "gpt-4o",
        "gpt-4.1", 
        "gemini-2.5-pro",
        "qwen2.5-7b-instruct",
        "claude37-sonnet"
    ]
    
    for model_name in test_models:
        if model_name in model_manager.registed_models:
            try:
                model = model_manager.registed_models[model_name]
                print(f"✓ {model_name}: Available")
            except Exception as e:
                print(f"✗ {model_name}: Error - {e}")
        else:
            print(f"✗ {model_name}: Not registered")

if __name__ == "__main__":
    test_models()