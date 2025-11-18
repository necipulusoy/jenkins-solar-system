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
        container('nodejs') {

          dependencyCheck additionalArguments: """
            --scan './'
            --out './'
            --data '/home/jenkins/agent/dependency-check-db'
            --format 'ALL'
            --prettyPrint
            --nvdApiKey ${env.NVD_API_KEY}
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

        // Coverage HTML raporunu publish et
        publishHTML([
          allowMissing: true,
          alwaysLinkToLastBuild: true,
          keepAll: true,
          reportDir: 'coverage/lcov-report',
          reportFiles: 'index.html',
          reportName: 'Code Coverage HTML Report',
          useWrapperFileDirectly: true
        ])
      }
    }

  }

  post {
    always {

      // Unit test report
      junit allowEmptyResults: true,
            keepLongStdio: true,
            testResults: 'test-results.xml'

      // Dependency check JUnit output
      junit allowEmptyResults: true,
            keepLongStdio: true,
            testResults: 'dependency-check-junit.xml'

      // OWASP HTML report
      publishHTML(
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: './',
        reportFiles: 'dependency-check-jenkins.html',
        reportName: 'Dependency Check HTML Report',
        useWrapperFileDirectly: true
      )

      // Code coverage HTML report
      publishHTML([
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: 'coverage/lcov-report',
        reportFiles: 'index.html',
        reportName: 'Code Coverage HTML Report'
      ])

      // Dependency Check result publisher
      dependencyCheckPublisher(
        unstableTotalCritical: 1,
        pattern: 'dependency-check-report.xml',
        stopBuild: false
      )

    }
  }

}
