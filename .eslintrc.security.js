module.exports = {
  extends: [
    'plugin:security/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['security', 'no-secrets'],
  rules: {
    // 보안 규칙
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    
    // 비밀 정보 감지
    'no-secrets/no-secrets': ['error', { 
      tolerance: 4.5,
      additionalRegexes: {
        'JWT': 'eyJ[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*',
        'AWS': 'AKIA[0-9A-Z]{16}',
        'GitHub': 'ghp_[0-9a-zA-Z]{36}',
        'Private Key': '-----BEGIN (RSA|EC|DSA) PRIVATE KEY-----'
      }
    }],
    
    // TypeScript 보안 규칙
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-non-null-assertion': 'error',
    
    // 일반 보안 모범 사례
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-with': 'error',
    'no-alert': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    
    // React 보안 규칙
    'react/no-danger': 'error',
    'react/no-danger-with-children': 'error',
    'react/no-find-dom-node': 'error',
    'react/no-string-refs': 'error',
    
    // 입력 검증
    'no-restricted-imports': ['error', {
      paths: [{
        name: 'child_process',
        message: 'child_process는 보안 위험이 있습니다. 대체 방법을 사용하세요.'
      }, {
        name: 'fs',
        message: 'fs 직접 사용은 위험합니다. 안전한 래퍼를 사용하세요.'
      }]
    }]
  },
  overrides: [{
    files: ['*.test.ts', '*.spec.ts'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'no-console': 'off'
    }
  }]
}