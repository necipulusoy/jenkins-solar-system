pipeline {
  agent {
    kubernetes {
      label 'k8s-agent-multi'
    }
  }

  stages {

    // 1) Dependencies kuruluyor
    stage('Installing Dependencies') {
      steps {
        container('nodejs') {
          sh 'npm install --no-audit'
        }
      }
    }

    // 2) NPM Audit (critical bulsa bile build durmasın, sadece uyarı versin)
    stage('NPM Audit (Critical Only)') {
      steps {
        container('nodejs') {
          script {
            def result = sh(returnStatus: true, script: "npm audit --audit-level=critical")
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

    // 3) OWASP Dependency Check taraması
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

    // 4) Unit Test (MongoDB bağlantılı)
    stage('Unit Testing (MongoDB)') {
      steps {
        container('nodejs') {

          // Jenkins’teki iki ayrı credential burada alınıyor
          withCredentials([
            string(credentialsId: 'mongodb-username', variable: 'MONGO_USERNAME'),
            string(credentialsId: 'mongodb-password', variable: 'MONGO_PASSWORD')
          ]) {

            // Dinamik MongoDB connection string oluştur
            script {
              env.MONGO_URI = "mongodb://${env.MONGO_USERNAME}:${env.MONGO_PASSWORD}@np-dev-mongodb.database.svc.cluster.local:27017/solarsystem?authSource=solarsystem"
            }

            sh """
              echo "Running Unit Tests..."
              echo "Using Mongo URI: \$MONGO_URI"
              npm test
            """
          }

        }
      }
    }

  }
}
