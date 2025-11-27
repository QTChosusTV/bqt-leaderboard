import random
import json
import subprocess
import os
import math

EXE = "solver.exe"
TIMEOUT = 10

def run_solver(inp: str) -> str:
    try:
        proc = subprocess.run(
            [EXE],
            input=inp.encode('utf-8'),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=TIMEOUT
        )
        return proc.stdout.decode('utf-8').strip()
    except:
        return "0"

def make_good_point(d):
    """
    Sinh một điểm nằm gần đường tròn Thales:
        x^2 + y^2 = x*d
    """
    x = random.randint(0, d)
    yy = max(0, x * (d - x))
    y = int(math.sqrt(yy) + random.uniform(-2, 2))
    return (x, y)

def make_bad_point():
    return (
        random.randint(-10**9, 10**9),
        random.randint(-10**9, 10**9)
    )

if __name__ == "__main__":
    random.seed(2025)
    tests = []

    # Test 1: ví dụ cơ bản
    tests.append({
        "input": "1\n5 4\n0 0\n4 0\n2 0\n2 2\n2 -1\n",
        "output": "3"
    })

    # Test 2~5: n nhỏ tới trung bình
    for n, good in [(50, 12), (200, 40), (500, 110), (800, 190)]:
        d = random.randint(100, 10**9)
        points = []

        for _ in range(good):
            points.append(make_good_point(d))
        for _ in range(n - good):
            points.append(make_bad_point())

        random.shuffle(points)
        inp = "1\n{} {}\n{}\n".format(
            n, d,
            "\n".join(f"{x} {y}" for x, y in points)
        )
        tests.append({
            "input": inp,
            "output": run_solver(inp)
        })

    # Test 6~10: T lớn, mỗi test n ~ 500–1000
    for T, n_per_test in [(10, 900), (20, 450), (40, 230), (70, 130), (100, 90)]:
        inp_lines = [str(T)]
        outputs = []
        current_sum = 0

        for _ in range(T):
            n = n_per_test + random.randint(-30, 30)
            n = max(50, min(n, 2000))

            current_sum += n
            if current_sum > 60000:
                n -= (current_sum - 60000)

            d = random.randint(1, 10**9)
            good = random.randint(max(1, n // 20), n // 8)

            points = []
            for _ in range(good):
                points.append(make_good_point(d))
            for _ in range(n - good):
                points.append(make_bad_point())
            random.shuffle(points)

            inp_lines.append(f"{n} {d}")
            for x, y in points:
                inp_lines.append(f"{x} {y}")

            single = "1\n{} {}\n{}\n".format(
                n, d,
                "\n".join(f"{x} {y}" for x, y in points)
            )
            outputs.append(run_solver(single))

        full_inp = "\n".join(inp_lines) + "\n"
        full_out = "\n".join(outputs)
        tests.append({"input": full_inp, "output": full_out})

    # Test cuối: n rất lớn 50k
    n = 50000
    d = 10**9
    good = 4000
    points = []
    for _ in range(good):
        points.append(make_good_point(d))
    for _ in range(n - good):
        points.append(make_bad_point())
    random.shuffle(points)

    inp_max = "1\n{} {}\n{}\n".format(
        n, d,
        "\n".join(f"{x} {y}" for x, y in points)
    )
    tests.append({"input": inp_max, "output": run_solver(inp_max)})

    # Tính tổng n
    total_n = 0
    for test in tests:
        for line in test["input"].splitlines():
            parts = line.split()
            if len(parts) == 2:
                try:
                    v = int(parts[0])
                    if 1 <= v <= 200000:
                        total_n += v
                except:
                    pass

    with open("testcases.json", "w", encoding="utf-8") as f:
        json.dump(tests, f, indent=2, ensure_ascii=False)

    print("Sinh xong", len(tests), "test. Tổng n =", total_n)
