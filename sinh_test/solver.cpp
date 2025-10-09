#include <bits/stdc++.h>
using namespace std;
#define ll long long

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n; cin >> n;
    vector<ll> a(n);
    for (auto &x : a) cin >> x;
    ll k; cin >> k;

    ll sum = 0;
    for (int i = 0; i < n; i++) {
        sum += a[i];
        if (sum >= k) {
            cout << i + 1 << "\n";
            return 0;
        }
    }
    cout << -1 << "\n";
}
