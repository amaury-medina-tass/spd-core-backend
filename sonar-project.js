const scanner = require('sonarqube-scanner').default;

scanner({
  serverUrl: 'http://localhost:9000',
  options: {
    'sonar.projectKey': 'spd-core-backend',
    'sonar.projectName': 'SPD Core Backend',
    'sonar.token': 'sqp_4deb24cc177088494a79604f0984d8684dba75a6',
    // Apuntamos a las carpetas raíz del monorepo
    'sonar.sources': 'apps,libs',
    'sonar.tests': 'apps,libs',
    'sonar.test.inclusions': 'apps/**/*.spec.ts,libs/**/*.spec.ts',
    'sonar.typescript.tsconfigPath': 'tsconfig.json',
    'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
    'sonar.exclusions': '**/node_modules/**,**/dist/**,**/test/**'
  }
}, () => process.exit());