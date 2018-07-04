pipeline {
  agent any
  options {
    skipDefaultCheckout()
  }
  stages {
    stage('Building: nrts-prc-api beta branch') {
      steps {
        script {
          try {
            echo "Building: ${env.JOB_NAME} #${env.BUILD_ID}"
            notifyBuild("Building: ${env.JOB_NAME} #${env.BUILD_ID}", "YELLOw")
            openshiftBuild bldCfg: 'nrts-prc-api-beta', showBuildLogs: 'true'
          } catch (e) {
            notifyBuild("BUILD ${env.JOB_NAME} #${env.BUILD_ID} ABORTED", "RED")
          }
        }
      }
    }
    stage('Deploy') {
      steps {
        script {
          try {
            echo "Deploying: ${env.JOB_NAME} #${env.BUILD_ID}"
            notifyBuild("Deploying: ${env.JOB_NAME} #${env.BUILD_ID}", "YELLOW")
            openshiftTag destStream: 'nrts-prc-api', verbose: 'true', destTag: 'beta', srcStream: 'nrts-prc-api', srcTag: '$BUILD_ID'
          } catch (e) {
            notifyBuild("DEPLOY ${env.JOB_NAME} #${env.BUILD_ID} ABORTED", "RED")
          }
        }
        notifyBuild("DEPLOYED: ${env.JOB_NAME} #${env.BUILD_ID}", "GREEN")
      }
    }
  }
}

def notifyBuild(String msg = '', String colour = 'GREEN') {
  if (colour == 'YELLOW') {
    colorCode = '#FFFF00'
  } else if (colour == 'GREEN') {
    colorCode = '#00FF00'
  } else {
    colorCode = '#FF0000'
  }

  // Send notifications
  slackSend (color: colorCode, message: msg)
}
