import json
import random
import os
import sys

NUM_TESTS = 50
MOD = 1000000007

def count_kary_strings(n, k, m, i, freq, s):
    # Base case: string of length n completed
    if i == n:
        return 1
    
    total = 0
    # Try each digit from 1 to k
    for digit in range(1, k + 1):
        if freq[digit] > 0:  # Check if digit can be used
            freq[digit] -= 1
            total = (total + count_kary_strings(n, k, m, i + 1, freq, s + str(digit))) % MOD
            freq[digit] += 1  # Backtrack
    
    return total

testcases = []

try:
    for test_num in range(NUM_TESTS):
        # Generate random values within constraints
        n = random.randint(1, random.randint(2, 11))  
        k = random.randint(1, random.randint(1, 11))  
        m = random.randint(1, n)   # Ensure m <= n
        
        # Initialize frequency array for digits 1 to k
        freq = [0] * (k + 1)  # Index 0 unused, 1 to k used
        for i in range(1, k + 1):
            freq[i] = m
        
        # Compute the output
        output = count_kary_strings(n, k, m, 0, freq, "")
        print(f"Test {test_num + 1}: n={n}, k={k}, m={m}, output={output}")  # Debugging output
        
        input_str = f"{n} {k} {m}"
        output_str = str(output)
        
        testcases.append({
            "input": input_str,
            "output": output_str
        })

    print("Current directory:", os.getcwd())

    output_file = "random_testcases.json"
    with open(output_file, "w") as f:
        json.dump(testcases, f, indent=2)

    print(f"{len(testcases)} testcases written to {output_file}")

except RecursionError as e:
    print(f"RecursionError: {e}. Consider reducing n.")
except PermissionError as e:
    print(f"PermissionError: {e}. Check write permissions in {os.getcwd()} or specify a different output file.")
except Exception as e:
    print(f"An error occurred: {e}")

if __name__ == "__main__":
    # No need to increase recursion limit for small n (up to 15)
    pass