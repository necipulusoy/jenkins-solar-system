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

    // DOCKER & NEXUS IMAGE PUSH CONFIG
    REGISTRY   = "my-nexus-repository-manager.nexus.svc.cluster.local:8082"
    REPO_PATH  = "repository/nexusimagerepository"
    IMAGE_NAME = "spring-petclinic-dev"
    CHART_NAME = "spring-petclinic-dev"
    NEXUS_HELM_REPO = "http://my-nexus-repository-manager.nexus.svc.cluster.local:8081/repository/nexushelmrepository/"
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
        container('jnlp') {
          dependencyCheck additionalArguments: """
            --scan './'
            --out './'
            --data '/home/jenkins/agent/dependency-check-db'
            --format 'ALL'
            --prettyPrint
            --nvdApiKey ${NVD_API_KEY}
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
      }
    }



    stage('SAST - SonarQube') {
      steps {
        container('sonar') {
          withSonarQubeEnv('sonar-server') {
            withCredentials([string(credentialsId: 'sonar-hepapi', variable: 'SONAR_TOKEN')]) {
              sh '''
                sonar-scanner \
                    -Dsonar.projectKey=Solar-System-Project \
                    -Dsonar.sources=app.js \
                    -Dsonar.tests=app-test.js \
                    -Dsonar.exclusions=coverage/**,app-test.js \
                    -Dsonar.host.url=$SONAR_HOST_URL \
                    -Dsonar.token=$SONAR_TOKEN \
                    -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
              '''
            }
          }
        }
      }
    }


    stage('Quality Gate') {
      steps {
        timeout(time: 60, unit: 'SECONDS') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Login to Nexus') {
      steps {
        container('docker') {
          withCredentials([usernamePassword(
            credentialsId: 'nexus-docker-creds',
            usernameVariable: 'USER',
            passwordVariable: 'PASS'
          )]) {
            sh '''
              echo "$PASS" | docker login "$REGISTRY" -u "$USER" --password-stdin
            '''
          }
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        container('docker') {
          sh '''
            IMAGE_TAG="1.0.${BUILD_NUMBER}"
            echo $IMAGE_TAG > version.txt
            docker build -t "$REGISTRY/$REPO_PATH/$IMAGE_NAME:$IMAGE_TAG" .
          '''
        }
      }
    }

    stage('Push Docker Image to Nexus') {
      steps {
        container('docker') {
          sh '''
            IMAGE_TAG=$(cat version.txt)
            docker push "$REGISTRY/$REPO_PATH/$IMAGE_NAME:$IMAGE_TAG"
          '''
        }
      }
    }

  }


  }

  post {
    always {

      junit allowEmptyResults: true,
            keepLongStdio: true,
            testResults: 'test-results.xml'

      junit allowEmptyResults: true,
            keepLongStdio: true,
            testResults: 'dependency-check-junit.xml'

      publishHTML(
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: './',
        reportFiles: 'dependency-check-jenkins.html',
        reportName: 'Dependency Check HTML Report',
        useWrapperFileDirectly: true
      )

      publishHTML([
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: 'coverage/lcov-report',
        reportFiles: 'index.html',
        reportName: 'Code Coverage HTML Report'
      ])

      dependencyCheckPublisher(
        unstableTotalCritical: 1,
        pattern: 'dependency-check-report.xml',
        stopBuild: false
      )

    }
  }

}
