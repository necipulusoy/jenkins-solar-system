pipeline {
  agent {
    kubernetes {
      label 'k8s-agent-multi'
    }
  }

  stages {
    stage('Node Version') {
      steps {
        container('nodejs') {
          sh '''
            node -v
            npm -v
          '''
        }
      }
    }
  }
}
