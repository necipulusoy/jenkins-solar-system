pipeline {
  agent {
    kubernetes {
      label 'k8s-agent-multi'
    }
  }

    tools {
        nodejs 'Node.js 25.0.0'
    }

    stages {
        stage('Node Version') {
            steps {
                sh '''
                    node -v
                    npm -v
                '''
            }
        }
    }
}


