#include <bits/stdc++.h>
#define ll long long
#define fto(i, n) for(ll i = 0; i < n; i++)
#define fito(i, a, n) for(int i = a; i <= n; i++)
#define fdto(i, a, n) for(int i = a; i >= n; i--)
#define fsto(i, a, n) for(ll i = a; i*i <= n; i++)
#define fincto(i, a, n, inc) for(ll i = a; i <= n; i+=inc)
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
#define oo2 998244353
#define maxN 100005

typedef vector<ll> vt;
typedef vector<string> smat;
typedef vector<pair<ll, ll>> vtpr;
typedef pair<ll, ll> pr;
typedef pair<int, int> pir;
typedef vector<pir> vtpir;
typedef vector<vector<ll>> mat;
typedef vector<vector<int>> mit;
typedef vector<int> vit;

string PNAME = "ROBOT";

mit adj, up;
int lk;
vit cnt, dep;

void dfs_init(int u, int p, int d) {
	dep[u] = d;
    up[u][0] = p;
    fito(k, 1, lk-1) {
        up[u][k] = up[up[u][k-1]][k-1];
    }
    for (int v : adj[u]) {
    	if (v != p) {
            dfs_init(v, u, d+1);
        }
    }
}

int lca(int u, int v) {
    if (dep[u] < dep[v]) swap(u, v);
    fdto(k, lk-1, 0) {
        if (dep[u] - (1 << k) >= dep[v]) {
            u = up[u][k];
        }
    }

    if (u == v) return u;

    fdto(k, lk-1, 0) {
        if (up[u][k] != up[v][k]) {
            u = up[u][k];
            v = up[v][k];
        }
    }
    return up[u][0];
}

void dfs_count(int u, int p) {
    for (int v : adj[u]) {
        if (v != p) {
            dfs_count(v, u);
            cnt[u] += cnt[v];
        }
    }
}

void query(int u, int v, int x) {
    int l = lca(u, v);
    cnt[u]+=x;
    cnt[v]+=x;
    cnt[l]-=x;
    if (up[l][0] != 0) cnt[up[l][0]]-=x;
}

int main() {

    faster;
    FILE* f = fopen((PNAME + ".INP").c_str(), "r");
    if (f) {
        fclose(f);
        read((PNAME + ".INP").c_str());
        write((PNAME + ".OUT").c_str());
    }

    int n; cin >> n;
    adj.resize(n+1);

    lk = 0;
    while ((1 << lk) <= n) lk++;
    up.assign(n+1, vit(lk, 0));
    dep.assign(n+1, 0);
	cnt.assign(n+1, 0);
    fito(i, 1, n-1) {
    	int u, v; cin >> u >> v;
        adj[u].pb(v);
        adj[v].pb(u);
    }

    dfs_init(1, 0, 0);

    int q; cin >> q;
    fito(i, 1, q) {
        int u, v; cin >> u >> v;
        int w; cin >> w;
        query(u, v, w);
    }

    dfs_count(1, 0);

    fito(i, 1, n) {
        cout << cnt[i] << " ";
    }

    return 0;
}
