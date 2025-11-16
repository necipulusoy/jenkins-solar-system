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
        withCredentials([string(credentialsId: 'nvd-api-key', variable: 'NVD_API_KEY')]) {

          dependencyCheck additionalArguments: """
            --scan './'
            --out './'
            --data '/home/jenkins/agent/dependency-check-db'
            --format 'ALL'
            --prettyPrint
            --nvdApiKey $NVD_API_KEY
            --disableRetireJS
            --nodePackageSkipDevDependencies
            --disableYarnAudit
            --disableOssIndex
          """,
          odcInstallation: 'OWASP-DepCheck-12'
        }
      }

      post {
        always {
          dependencyCheckPublisher(
            unstableTotalCritical: 1,
            pattern: 'dependency-check-report.xml',
            stopBuild: false
          )

          publishHTML(
            allowMissing: true,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: './',
            reportFiles: 'dependency-check-jenkins.html',
            reportName: 'Dependency Check HTML Report',
            reportTitles: '',
            useWrapperFileDirectly: true
          )
        }
      }
    }

    stage('Unit Testing (MongoDB)') {
      steps {
        container('nodejs') {

          withCredentials([
            usernamePassword(
              credentialsId: 'mongodb-creds',
              usernameVariable: 'MONGO_USERNAME',
              passwordVariable: 'MONGO_PASSWORD'
            )
          ]) {

            script {
              env.MONGO_URI = "mongodb://${env.MONGO_USERNAME}:${env.MONGO_PASSWORD}@np-dev-mongodb.database.svc.cluster.local:27017/solarsystem?authSource=solarsystem"
            }

            sh """
              echo 'Running unit tests...'
              echo 'Connection string set.'
              npm test
            """
          }
        }
      }

      post {
        always {
          junit allowEmptyResults: true,
                keepLongStdio: true,
                testResults: 'test-results.xml'
        }
      }
    }


    stage('Code Coverage (MongoDB)') {
      steps {
        container('nodejs') {

          // Aynı Mongo credential’ları kullanıyoruz
          withCredentials([
            usernamePassword(
              credentialsId: 'mongodb-creds',
              usernameVariable: 'MONGO_USERNAME',
              passwordVariable: 'MONGO_PASSWORD'
            )
          ]) {

            script {
              env.MONGO_URI = "mongodb://${env.MONGO_USERNAME}:${env.MONGO_PASSWORD}@np-dev-mongodb.database.svc.cluster.local:27017/solarsystem?authSource=solarsystem"
            }

            // catchError: coverage düşük olsa bile pipeline kırılmasın
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

        // Coverage HTML raporunu publish et
        publishHTML([
          allowMissing: true,
          alwaysLinkToLastBuild: true,
          keepAll: true,
          reportDir: 'coverage/lcov-report',
          reportFiles: 'index.html',
          reportName: 'Code Coverage HTML Report',
          reportTitles: '',
          useWrapperFileDirectly: true
        ])
      }
    }

  }
}
