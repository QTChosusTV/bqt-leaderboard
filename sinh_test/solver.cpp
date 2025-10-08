#include <bits/stdc++.h>
#define ll long long
#define fto(i, n) for(ll i = 0; i < n; i++)
#define fito(i, a, n) for(int i = a; i <= n; i++)
#define fdto(i, a, n) for(int i = a; i >= n; i--)
#define fsto(i, a, n) for(ll i = a; i*i <= n; i++)
#define umap unordered_map
#define eb emplace_back
#define sz(x) (int)(x).size()
#define all(x) (x).begin(), (x).end()
#define all1(x) (x).begin()+1, (x).end()
#define allr(x) (x).rbegin(), (x).rend()
#define len(x) (x).length()
#define fi first
#define se second
#define pb push_back
#define faster ios_base::sync_with_stdio(false); cin.tie(0); cout.tie(0);
#define read(x) freopen(x, "r", stdin)
#define write(x) freopen(x, "w", stdout)
using namespace std;

#define oo 1000000007

typedef vector<ll> vt;
typedef vector<string> smat;
typedef vector<pair<ll, ll>> vtpr;
typedef pair<ll, ll> pr;
typedef pair<int, int> pir;
typedef vector<pir> vtpir;
typedef vector<vector<ll>> mat;
typedef vector<vector<int>> mit;
typedef vector<int> vit;


string PNAME = "SEQ";

int main () {

    FILE* f = fopen((PNAME + ".INP").c_str(), "r");
    if (f) {
        fclose(f);
        read((PNAME + ".INP").c_str());
        write((PNAME + ".OUT").c_str());
    }

    int n, q; cin >> n >> q;
    vtpr a(n+1);
    vt qs(q+1, 0);
    fito(i, 1, n) {
        cin >> a[i].fi;
        a[i].se = i;
    }
	fito(i, 1, q) cin >> qs[i];

    vt qs2 = qs;

    map<ll, ll> ans;
    map<ll, ll> forward;
    map<ll, ll> backward;

    sort(all1(a));
    sort(all1(qs));

    ll pt = 1;
    ll cnt = 0;
    fito(i, 1, q) {
        ll k = qs[i];
		while (pt <= n && a[pt].fi <= k) {
            ll idx = a[pt].se;
            if (backward.count(idx-1) && forward.count(idx+1)) {
                ll l = backward[idx-1];
                ll r = forward[idx+1];
                forward.erase(idx+1);
                backward[r] = l;
                forward[l] = r;
                cnt = max(cnt, r-l+1);
            } else if (backward.count(idx-1)) {
                ll l = backward[idx-1];
                ll r = idx;
                backward.erase(idx-1);
                forward[l] = r;
                backward[r] = l;
                cnt = max(cnt, r-l+1);
            } else if (forward.count(idx+1)) {
                ll l = idx;
                ll r = forward[idx+1];
                forward.erase(idx+1);
                forward[l] = r;
                backward[r] = l;
                cnt = max(cnt, r-l+1);
            } else {
                forward[idx] = idx;
                backward[idx] = idx;
                cnt = max(cnt, 1LL);
            }
            pt++;
        }
        ans[k] = cnt;
    }

 	fito(i, 1, q) cout << ans[qs2[i]] << "\n";
    return 0;
}
