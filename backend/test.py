import unittest
import time

def retry(max_retries=3, wait=1):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for i in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except AssertionError as e:
                    print(f"Retry {i+1}/{max_retries}: {e}")
                    time.sleep(wait)
            return func(*args, **kwargs)
        return wrapper
    return decorator

class TestMyFunction(unittest.TestCase):
    @retry(max_retries=3, wait=1)
    def test_something(self):
        # Your test code goes here
        self.assertEqual(1, 2)  # This will fail

if __name__ == '__main__':
    unittest.main()