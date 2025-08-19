export interface LanguageTemplate {
  language: string
  displayName: string
  monacoLanguage: string
  defaultCode: string
  fileExtension: string
}

export const languageTemplates: LanguageTemplate[] = [
  {
    language: 'cpp',
    displayName: 'C++',
    monacoLanguage: 'cpp',
    fileExtension: '.cpp',
    defaultCode: `#include <iostream>
using namespace std;

int main() {
    // Your C++ code here
    cout << "Hello, World!" << endl;
    return 0;
}`
  },
  {
    language: 'python',
    displayName: 'Python',
    monacoLanguage: 'python',
    fileExtension: '.py',
    defaultCode: `# Your Python code here
def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`
  }
]

export const getLanguageTemplate = (language: string): LanguageTemplate | undefined => {
  return languageTemplates.find(template => template.language === language)
}
