pipeline {
  agent {
    kubernetes {
      label 'k8s-agent-multi'
    }
  }

  stages {

    /***************************
     * 1) Install Dependencies
     ***************************/
    stage('Installing Dependencies') {
      steps {
        container('nodejs') {
          sh 'npm install --no-audit'
        }
      }
    }

    /***************************
     * 2) NPM Audit (Fail on Critical)
     ***************************/
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

    /***************************
     * 3) OWASP Dependency Check (Scan)
     ***************************/
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

          /******************************************
           * 3A) OWASP XML Report Publisher
           ******************************************/
          dependencyCheckPublisher(
            failedTotalCritical: 1,
            pattern: 'dependency-check-report.xml',
            stopBuild: true
          )

          /******************************************
           * 3B) Publish JUnit result as test results
           ******************************************/
          junit allowEmptyResults: true,
                keepProperties: true,
                testResults: 'dependency-check-junit.xml'

          /******************************************
           * 3C) Publish HTML Report
           ******************************************/
          publishHTML([
            allowMissing: true,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: './',
            reportFiles: 'dependency-check-jenkins.html',
            reportName: 'Dependency Check HTML Report',
