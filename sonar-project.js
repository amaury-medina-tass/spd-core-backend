const scanner = require('sonarqube-scanner').default;

scanner({
  serverUrl: 'http://localhost:9000',
  options: {
    'sonar.projectKey': 'spd-core-backend-key',
    'sonar.projectName': 'SPD Core Backend',
    'sonar.token': 'sqp_82288cd50c81137ec92e4fd9fa1e72970e3488d4',
    // Apuntamos a las carpetas raíz del monorepo (Apps y Libs)
    'sonar.sources': 'apps,libs',
    'sonar.tests': 'apps,libs',
    'sonar.test.inclusions': 'apps/**/*.spec.ts,libs/**/*.spec.ts',
    'sonar.typescript.tsconfigPath': 'tsconfig.json',
    'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',

    'sonar.exclusions': '**/node_modules/**,**/dist/**,**/test/**,**/*.dto.ts,**/*.entity.ts,**/*.module.ts,**/main.ts,**/index.ts,**/*.config.ts'
  }
}, () => process.exit());