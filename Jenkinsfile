pipeline {
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
            def result = sh(returnStatus: true, script: "npm audit --audit-level=critical")
            if (result != 0) {
              echo "WARNING: NPM found CRITICAL vulnerabilities"
              echo "Build will CONTINUE (fail disabled)"
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

          junit allowEmptyResults: true,
                keepProperties: true,
                testResults: 'dependency-check-junit.xml'

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

          // Tek credential (username + password)
          withCredentials([
            usernamePassword(
              credentialsId: 'mongodb-creds',
              usernameVariable: 'MONGO_USERNAME',
              passwordVariable: 'MONGO_PASSWORD'
            )
          ]) {

            script {
              // Final, doğru connection string
              env.MONGO_URI = "mongodb://${env.MONGO_USERNAME}:${env.MONGO_PASSWORD}@np-dev-mongodb.database.svc.cluster.local:27017/solarsystem?authSource=solarsystem"
            }

            sh """
              echo "Running Unit Tests..."
              echo "MongoDB connection string generated."
              npm test
            """
          }

        }
      }
    }

  }
}
