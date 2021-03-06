// 상수들 저장 객체
const CONST = {
  // GIT_REPO: 'https://github.com/tmax-cloud/hypercloud-install-guide.git',
  K8S_REPO: 'https://github.com/tmax-cloud/install-k8s.git',
  CNI_REPO: 'https://github.com/tmax-cloud/install-cni.git',
  METAL_LB_REPO: 'https://github.com/tmax-cloud/install-metallb.git',
  ROOK_CEPH_REPO: 'https://github.com/tmax-cloud/install-rookceph.git',
  PROMETHEUS_REPO: 'https://github.com/tmax-cloud/install-prometheus.git',
  CATALOG_REPO: 'https://github.com/tmax-cloud/install-catalog.git',
  HYPERAUTH_REPO: 'https://github.com/tmax-cloud/install-hyperauth.git',
  INGRESS_REPO: 'https://github.com/tmax-cloud/install-ingress.git',
  HYPERCLOUD_REPO: 'https://github.com/tmax-cloud/install-hypercloud.git',
  GRAFANA_REPO: 'https://github.com/tmax-cloud/install-grafana.git',
  CONSOLE_REPO: 'https://github.com/tmax-cloud/install-console.git',
  SECRET_WATCHER_REPO:
    'https://github.com/tmax-cloud/install-secretwatcher.git',
  TSB_REPO: 'https://github.com/tmax-cloud/install-tsb.git',
  TEKTON_REPO: 'https://github.com/tmax-cloud/install-tekton.git',
  GIT_BRANCH: '4.1',
  PRODUCT: {
    KUBERNETES: {
      NAME: 'Kubernetes',
      IS_REQUIRED: true, // Required
      DESC: '컨테이너화된 앱을 자동 배포하고 스케일링, 관리하는 시스템',
      SUPPORTED_VERSION: ['1.17.6']
    },
    CNI: {
      NAME: 'CNI',
      IS_REQUIRED: true, // Required
      DESC: '컨테이너 간의 네트워킹을 제어할 수 있는 플러그인',
      SUPPORTED_VERSION: ['3.13.4'],
      SUPPORTED_TYPE: ['Calico']
    },
    METAL_LB: {
      NAME: 'MetalLB',
      IS_REQUIRED: true, // Optional
      DESC: '로드 밸런싱 기능을 제공하는 플러그인'
    },
    ROOK_CEPH: {
      NAME: 'Rook Ceph',
      IS_REQUIRED: true, // Optional
      DESC: '스토리지 기능을 제공하는 플러그인'
    },
    PROMETHEUS: {
      NAME: 'Prometheus',
      IS_REQUIRED: true, // Optional
      DESC: '모니터링 및 경고 기능을 제공하는 플러그인'
    },
    CATALOG_CONTROLLER: {
      NAME: 'Catalog Controller',
      IS_REQUIRED: true, // Optional
      DESC: 'Catalog Controller'
    },
    HYPERAUTH: {
      NAME: 'HyperAuth',
      IS_REQUIRED: true, // Optional
      DESC: 'HyperCloud 인증 플러그 인'
    },
    HYPERCLOUD: {
      NAME: 'HyperCloud',
      IS_REQUIRED: true, // Optional
      DESC: '쿠버네티스 기반의 오픈 클라우드 플랫폼'
    },
    TEKTON: {
      NAME: 'Tekton',
      IS_REQUIRED: true, // Optional
      DESC: 'CI/CD 기능을 제공하는 플러그 인'
    }
  }
};

export default CONST;
