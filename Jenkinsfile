// CI for go-date-web-app: kaniko builds the Dockerfile and pushes :latest to the
// in-cluster registry. The Helm chart deploys :latest (imagePullPolicy: Always),
// so Argo CD picks up each new build without a chart tag-bump push-back.
pipeline {
  agent {
    kubernetes {
      yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: kaniko
      image: gcr.io/kaniko-project/executor:debug
      imagePullPolicy: IfNotPresent
      command: ["/busybox/cat"]
      tty: true
'''
    }
  }

  options {
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    REGISTRY   = 'kind-registry:5000'
    IMAGE_REPO = 'lw-idp/go-date-web-app'
  }

  stages {
    stage('Build & push image') {
      steps {
        container('kaniko') {
          sh '''
            /kaniko/executor \
              --dockerfile=Dockerfile \
              --context=. \
              --destination=${REGISTRY}/${IMAGE_REPO}:latest \
              --destination=${REGISTRY}/${IMAGE_REPO}:${GIT_COMMIT} \
              --insecure --skip-tls-verify
          '''
        }
      }
    }
  }
}
