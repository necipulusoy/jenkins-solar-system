pipeline {
  agent {
    kubernetes {
      label 'k8s-agent-multi'
    }
  }

  stages {

    stage('Show Workspace') {
      steps {
        container('nodejs') {
          sh '''
            echo "==== CURRENT WORKSPACE PATH ===="
            pwd
            echo "==== WORKSPACE CONTENT ===="
            ls -al
          '''
        }
      }
    }

    stage('Install Dependencies') {
      steps {
        container('nodejs') {
          sh '''
            npm install --no-audit
          '''
        }
      }
    }

    stage('List Node Modules') {
      steps {
        container('nodejs') {
          sh '''
            echo "==== node_modules içerik örneği-deneme ===="
            ls -al node_modules | head
          '''
        }
      }
    }
  }
}