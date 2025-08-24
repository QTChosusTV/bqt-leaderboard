import json
import random
import os

NUM_TESTS = 12
MAX_N = 12

testcases = []

def fib(n):
    if n <= 1:
        return 1
    return n * fib(n-1)

for _ in range(NUM_TESTS):
    n = _+1
    ans = fib(n)

    input_str = f"{n}"
    output_str = f"{ans}"

    testcases.append({
        "input": input_str,
        "output": output_str
    })

print("Current directory:", os.getcwd())

output_file = "fib_testcases.json"
with open(output_file, "w") as f:
    json.dump(testcases, f, indent=2)

print(f"{len(testcases)} testcases written to {output_file}")
