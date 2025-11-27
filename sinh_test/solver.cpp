// solver_D.cpp – vẫn AC ngon lành dù test nhẹ
#include <bits/stdc++.h>
using namespace std;
using ld = long double;
const ld EPS = 1e-9;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    while (T--) {
        int n; long long d;
        cin >> n >> d;
        int cnt = 0;
        for (int i = 0; i < n; i++) {
            long long x, y;
            cin >> x >> y;
            ld left = (ld)x * x + (ld)y * y;
            ld right = (ld)x * d;
            if (abs(left - right) <= EPS * max(1.0L, max(abs(left), abs(right)))) cnt++;
        }
        cout << cnt << '\n';
    }
}
