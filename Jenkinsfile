pipeline {
  agent {
    kubernetes {
      label 'k8s-agent-multi'
    }
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


