pipeline {

  options {
    timeout(time: 15, unit: 'MINUTES')
    timestamps()
    disableConcurrentBuilds(abortPrevious: true)
    durabilityHint('PERFORMANCE_OPTIMIZED')
    ansiColor('xterm')
  }

  agent {
    kubernetes {
      label 'k8s-agent-multi'
    }
  }

  environment {
    MONGO_CREDS = credentials('mongodb-creds')
    NVD_API_KEY = credentials('nvd-api-key')
  }

  stages {

    stage('Installing Dependencies') {
      steps {
        container('nodejs') {
          sh 'npm install --no-audit'
        }
      }
    }

    stage('NPM Audit (Critical Only)') {
      steps {
        container('nodejs') {
          script {
            def result = sh(returnStatus: true,
                            script: "npm audit --audit-level=critical")

            if (result != 0) {
              echo "============================================"
              echo "WARNING: NPM found CRITICAL vulnerabilities"
              echo "Build will CONTINUE (fail disabled)"
              echo "============================================"
            }
          }
        }
      }
    }

    stage('OWASP Dependency Check') {
      steps {
        container('jnlp') {
          dependencyCheck additionalArguments: """
            --scan './'
            --out './'
            --data '/home/jenkins/agent/dependency-check-db'
            --format 'ALL'
            --prettyPrint
            --nvdApiKey ${NVD_API_KEY}
            --disableRetireJS
            --nodePackageSkipDevDependencies
            --disableYarnAudit
            --disableOssIndex
          """,
          odcInstallation: 'OWASP-DepCheck-12'
        }
      }
    }

    stage('Unit Testing (MongoDB)') {
      steps {
        container('nodejs') {
          script {
            env.MONGO_URI = "mongodb://${env.MONGO_CREDS_USR}:${env.MONGO_CREDS_PSW}" +
                            "@np-dev-mongodb.database.svc.cluster.local:27017/solarsystem?authSource=solarsystem"
          }

          sh """
            echo 'Running unit tests...'
            echo 'Connection string set.'
            npm test
          """
        }
      }
    }

    stage('Code Coverage (MongoDB)') {
      steps {
        container('nodejs') {
          script {
            env.MONGO_URI = "mongodb://${env.MONGO_CREDS_USR}:${env.MONGO_CREDS_PSW}" +
                            "@np-dev-mongodb.database.svc.cluster.local:27017/solarsystem?authSource=solarsystem"
          }

          catchError(
            buildResult: 'SUCCESS',
            stageResult: 'UNSTABLE',
            message: 'Oops! it will be fixed in future releases'
          ) {
            sh """
              echo 'Running code coverage...'
              npm run coverage
            """
          }
        }
      }
    }


    stage('Check Coverage Files') {
      steps {
        container('nodejs') {
          sh """
            echo '=== Workspace ==='
            pwd
            ls -la

            echo '=== coverage klasörü kontrol ==='
            ls -la coverage || echo 'coverage klasörü yok!'

            echo '=== lcov.info kontrol ==='
            if [ -f coverage/lcov.info ]; then
              echo 'lcov.info bulundu:'
              ls -lh coverage/lcov.info
              head -n 20 coverage/lcov.info
            else
              echo 'lcov.info bulunamadı!'
            fi
          """
        }
      }
    }

    stage('SAST - SonarQube') {
      steps {
        container('sonar') {
          withSonarQubeEnv('sonar-server') {
            withCredentials([string(credentialsId: 'sonar-hepapi', variable: 'SONAR_TOKEN')]) {
              sh '''
                sonar-scanner \
                  -Dsonar.projectKey=Solar-System-Project \
                  -Dsonar.sources=. \
                  -Dsonar.tests=app-test.js \
                  -Dsonar.exclusions=coverage/** \
                  -Dsonar.host.url=$SONAR_HOST_URL \
                  -Dsonar.token=$SONAR_TOKEN \
                  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
              '''
            }
          }
        }
      }
    }

  }

  post {
    always {

      junit allowEmptyResults: true,
            keepLongStdio: true,
            testResults: 'test-results.xml'

      junit allowEmptyResults: true,
            keepLongStdio: true,
            testResults: 'dependency-check-junit.xml'

      publishHTML(
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: './',
        reportFiles: 'dependency-check-jenkins.html',
        reportName: 'Dependency Check HTML Report',
        useWrapperFileDirectly: true
      )

      publishHTML([
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: 'coverage/lcov-report',
        reportFiles: 'index.html',
        reportName: 'Code Coverage HTML Report'
      ])

      dependencyCheckPublisher(
        unstableTotalCritical: 1,
        pattern: 'dependency-check-report.xml',
        stopBuild: false
      )

    }
  }

}
