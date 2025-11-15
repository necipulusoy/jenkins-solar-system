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
          sh '''
            echo "Running npm audit..."
            npm audit --audit-level=critical
          '''
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
          """,
          odcInstallation: 'OWASP-DepCheck-12'
        }
      }
      post {
        always {

          dependencyCheckPublisher(
            failedTotalCritical: 1,
            pattern: 'dependency-check-report.xml',
            stopBuild: true
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

  }
}
