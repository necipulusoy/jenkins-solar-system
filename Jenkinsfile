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

    stage('OWASP Dependency Check (Scan Only)') {
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
          dependencyCheckPublisher pattern: 'dependency-check-report.xml', stopBuild: false
        }
      }
    }

  }
}
