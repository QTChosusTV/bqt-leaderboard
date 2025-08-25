import json
import random
import os

NUM_TESTS = 10
MIN_N = 1
MAX_N = 1_000_000_000

testcases = []
str_list = []

def bin(i, n, s):
    if i > n:
        str_list.append(s)
        return
    bin(i+1, n, s+"0")
    bin(i+1, n, s+"1")

for _ in range(NUM_TESTS):
    
    n = _+1
    str_list = []
    bin(1, n, "")

    input_str = f"{n}"
    output_str = ""

    for s in str_list:
        output_str = output_str + s + "\n"

    testcases.append({
        "input": input_str,
        "output": output_str
    })

print("Current directory:", os.getcwd())

output_file = "random_testcases.json"
with open(output_file, "w") as f:
    json.dump(testcases, f, indent=2)

print(f"{len(testcases)} testcases written to {output_file}")
