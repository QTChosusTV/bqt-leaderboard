import random, json, subprocess, os

MAX_VAL = 10**4
EXE = "sinh_test/solver.exe"

def run_solver(inp: str) -> str:
    proc = subprocess.run([EXE], input=inp.encode(),
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return proc.stdout.decode().strip()

def gen_case(n):
    arr = [random.randint(1, random.randint(1, random.randint(1, MAX_VAL))) for _ in range(n)]
    k = random.randint(1, len(arr)*MAX_VAL//7)
    inp = f"{n}\n" + " ".join(map(str, arr)) + f"\n{k}"
    out = run_solver(inp)
    return {"input": inp, "output": out}

random.seed(2025)
tests = []

# small
for _ in range(8):
    n = random.randint(10, 1000)
    tests.append(gen_case(n))

# large
for _ in range(2):
    n = random.randint(50000, 100000)
    tests.append(gen_case(n))


os.makedirs("sinh_test", exist_ok=True)
with open("sinh_test/testcases.json", "w") as f:
    json.dump(tests, f, indent=2)

print(f"{len(tests)} testcases generated for Equation of Destiny.")
