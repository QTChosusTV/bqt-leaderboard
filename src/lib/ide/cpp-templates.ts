export interface CodeTemplate {
  name: string
  code: string
  description: string
}

export const cppTemplates: CodeTemplate[] = [
  {
    name: 'Basic C++',
    description: 'Simple C++ template with main function',
    code: `#include <iostream>
using namespace std;

int main() {
    // Your code here
    cout << "Hello, World!" << endl;
    return 0;
}`
  },
  {
    name: 'Competitive Programming',
    description: 'Optimized template for competitive programming with fast I/O',
    code: `#include <bits/stdc++.h>
using namespace std;

#define ll long long
#define ld long double
#define pb push_back
#define mp make_pair
#define fi first
#define se second
#define all(x) x.begin(), x.end()
#define rall(x) x.rbegin(), x.rend()
#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL);

const int MOD = 1e9 + 7;
const int INF = 1e9;
const ll LINF = 1e18;

void solve() {
    // Your solution here
    
}

int main() {
    fast_io;
    
    int t = 1;
    // cin >> t;
    
    while(t--) {
        solve();
    }
    
    return 0;
}`
  },
  {
    name: 'Graph Template',
    description: 'Template with common graph structures and algorithms',
    code: `#include <bits/stdc++.h>
using namespace std;

const int MAXN = 1e5 + 5;
vector<int> adj[MAXN];
bool visited[MAXN];
int dist[MAXN];

void dfs(int u) {
    visited[u] = true;
    
    for(int v : adj[u]) {
        if(!visited[v]) {
            dfs(v);
        }
    }
}

void bfs(int start) {
    queue<int> q;
    q.push(start);
    visited[start] = true;
    dist[start] = 0;
    
    while(!q.empty()) {
        int u = q.front();
        q.pop();
        
        for(int v : adj[u]) {
            if(!visited[v]) {
                visited[v] = true;
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n, m;
    cin >> n >> m;
    
    for(int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u); // For undirected graph
    }
    
    // Your code here
    
    return 0;
}`
  },
  {
    name: 'Dynamic Programming',
    description: 'Template with common DP patterns',
    code: `#include <bits/stdc++.h>
using namespace std;

const int MAXN = 1005;
const int INF = 1e9;
int dp[MAXN][MAXN];
int n, m;

// Example: Longest Common Subsequence
int lcs(string s1, string s2) {
    int n = s1.length();
    int m = s2.length();
    
    for(int i = 0; i <= n; i++) {
        for(int j = 0; j <= m; j++) {
            if(i == 0 || j == 0) {
                dp[i][j] = 0;
            } else if(s1[i-1] == s2[j-1]) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    
    return dp[n][m];
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Your code here
    
    return 0;
}`
  },
  {
    name: 'Segment Tree',
    description: 'Template for segment tree data structure',
    code: `#include <bits/stdc++.h>
using namespace std;

const int MAXN = 1e5 + 5;
int tree[4 * MAXN];
int arr[MAXN];

void build(int node, int start, int end) {
    if(start == end) {
        tree[node] = arr[start];
    } else {
        int mid = (start + end) / 2;
        build(2*node, start, mid);
        build(2*node+1, mid+1, end);
        tree[node] = tree[2*node] + tree[2*node+1]; // Change operation as needed
    }
}

void update(int node, int start, int end, int idx, int val) {
    if(start == end) {
        arr[idx] = val;
        tree[node] = val;
    } else {
        int mid = (start + end) / 2;
        if(idx <= mid) {
            update(2*node, start, mid, idx, val);
        } else {
            update(2*node+1, mid+1, end, idx, val);
        }
        tree[node] = tree[2*node] + tree[2*node+1]; // Change operation as needed
    }
}

int query(int node, int start, int end, int l, int r) {
    if(r < start || end < l) {
        return 0; // Return appropriate value for your operation
    }
    if(l <= start && end <= r) {
        return tree[node];
    }
    int mid = (start + end) / 2;
    int p1 = query(2*node, start, mid, l, r);
    int p2 = query(2*node+1, mid+1, end, l, r);
    return p1 + p2; // Change operation as needed
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    cin >> n;
    
    for(int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    build(1, 0, n-1);
    
    // Your queries here
    
    return 0;
}`
  },
  {
    name: 'Binary Search',
    description: 'Template for binary search problems',
    code: `#include <bits/stdc++.h>
using namespace std;

// Standard binary search
int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    
    while(left <= right) {
        int mid = left + (right - left) / 2;
        
        if(arr[mid] == target) {
            return mid;
        } else if(arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1; // Not found
}

// Binary search on answer
bool check(int mid) {
    // Implement your check function
    return true;
}

int binarySearchAnswer(int low, int high) {
    int ans = -1;
    
    while(low <= high) {
        int mid = low + (high - low) / 2;
        
        if(check(mid)) {
            ans = mid;
            high = mid - 1; // For minimum, use low = mid + 1 for maximum
        } else {
            low = mid + 1; // For minimum, use high = mid - 1 for maximum
        }
    }
    
    return ans;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Your code here
    
    return 0;
}`
  }
]

export const getTemplateByName = (name: string): CodeTemplate | undefined => {
  return cppTemplates.find(template => template.name === name)
}
