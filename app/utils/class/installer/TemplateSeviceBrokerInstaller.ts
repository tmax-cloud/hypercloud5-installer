/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
import * as scp from '../../common/scp';
import AbstractInstaller from './AbstractInstaller';
import Env, { NETWORK_TYPE } from '../Env';
import ScriptFactory from '../script/ScriptFactory';
import CONST from '../../constants/constant';

export default class TemplateSeviceBrokerInstaller extends AbstractInstaller {
  public static readonly DIR = `install-tsb`;

  public static readonly INSTALL_HOME = `${Env.INSTALL_ROOT}/${TemplateSeviceBrokerInstaller.DIR}`;

  public static readonly IMAGE_HOME = `${TemplateSeviceBrokerInstaller.INSTALL_HOME}/image`;

  public static readonly VERSION = `4.0.0.6`;

  // singleton
  private static instance: TemplateSeviceBrokerInstaller;

  private constructor() {
    super();
  }

  static get getInstance() {
    if (!TemplateSeviceBrokerInstaller.instance) {
      TemplateSeviceBrokerInstaller.instance = new TemplateSeviceBrokerInstaller();
    }
    return this.instance;
  }

  public async install(param: { callback: any; setProgress: Function }) {
    const { callback } = param;

    await this.preWorkInstall({
      callback
    });

    await this._installMainMaster(callback);
  }

  public async remove() {
    await this._removeMainMaster();
  }

  // protected abstract 구현
  protected async preWorkInstall(param?: any) {
    console.debug('@@@@@@ Start pre-installation... @@@@@@');
    const { callback } = param;
    if (this.env.networkType === NETWORK_TYPE.INTERNAL) {
      // internal network 경우 해주어야 할 작업들
      /**
       * 1. 해당 이미지 파일 다운(client 로컬), 전송 (main 마스터 노드)
       * 2. git guide 다운(client 로컬), 전송(각 노드)
       */
      await this.downloadImageFile();
      await this.sendImageFile();

      await this.downloadGitFile();
      await this.sendGitFile();
      // TODO: downloadYamlAtLocal();
      // TODO: sendYaml();
    } else if (this.env.networkType === NETWORK_TYPE.EXTERNAL) {
      // external network 경우 해주어야 할 작업들
      /**
       * 1. public 패키지 레포 등록, 설치 (각 노드) (필요 시)
       * 2. git guide clone (마스터 노드)
       */
      await this.cloneGitFile(callback);
      // await this._downloadYaml();
    }

    if (this.env.registry) {
      // 내부 image registry 구축 경우 해주어야 할 작업들
      /**
       * 1. 레지스트리 관련 작업
       */
      await this.registryWork({
        callback
      });
    }
    console.debug('###### Finish pre-installation... ######');
  }

  protected async downloadImageFile() {
    // TODO: download image file
    console.debug(
      '@@@@@@ Start downloading the image file to client local... @@@@@@'
    );
    console.debug(
      '###### Finish downloading the image file to client local... ######'
    );
  }

  protected async sendImageFile() {
    console.debug(
      '@@@@@@ Start sending the image file to main master node... @@@@@@'
    );
    const { mainMaster } = this.env.getNodesSortedByRole();
    const srcPath = `${Env.LOCAL_INSTALL_ROOT}/${TemplateSeviceBrokerInstaller.DIR}/`;
    await scp.sendFile(
      mainMaster,
      srcPath,
      `${TemplateSeviceBrokerInstaller.IMAGE_HOME}/`
    );
    console.debug(
      '###### Finish sending the image file to main master node... ######'
    );
  }

  protected downloadGitFile(param?: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  protected sendGitFile(param?: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  protected async cloneGitFile(callback: any) {
    console.debug('@@@@@@ Start clone the GIT file at each node... @@@@@@');
    const { mainMaster } = this.env.getNodesSortedByRole();
    const script = ScriptFactory.createScript(mainMaster.os.type);
    // FIXME: tsb git branch명 통일되지 않음
    mainMaster.cmd = script.cloneGitFile(CONST.TSB_REPO, 'tsb-4.1');
    await mainMaster.exeCmd(callback);
    console.debug('###### Finish clone the GIT file at each node... ######');
  }

  protected async registryWork(param: { callback: any }) {
    console.debug(
      '@@@@@@ Start pushing the image at main master node... @@@@@@'
    );
    const { callback } = param;
    const { mainMaster } = this.env.getNodesSortedByRole();
    mainMaster.cmd = this.getImagePushScript();
    await mainMaster.exeCmd(callback);
    console.debug(
      '###### Finish pushing the image at main master node... ######'
    );
  }

  protected getImagePushScript(): string {
    let gitPullCommand = `
    mkdir -p ~/${TemplateSeviceBrokerInstaller.IMAGE_HOME};
    export TSB_HOME=~/${TemplateSeviceBrokerInstaller.IMAGE_HOME};
    export TSB_VERSION=v${TemplateSeviceBrokerInstaller.VERSION};
    export REGISTRY=${this.env.registry};
    cd $TSB_HOME;
    `;
    if (this.env.networkType === NETWORK_TYPE.INTERNAL) {
      gitPullCommand += `
      docker load < template-service-broker_b\${TSB_VERSION}.tar
      `;
    } else {
      gitPullCommand += `
      docker pull tmaxcloudck/template-service-broker:b\${TSB_VERSION}

      #docker save tmaxcloudck/template-service-broker:b\${TSB_VERSION} > template-service-broker_b\${TSB_VERSION}.tar
      `;
    }
    return `
      ${gitPullCommand}
      docker tag tmaxcloudck/template-service-broker:b\${TSB_VERSION} \${REGISTRY}/tmaxcloudck/template-service-broker:b\${TSB_VERSION}

      docker push \${REGISTRY}/tmaxcloudck/template-service-broker:b\${TSB_VERSION}
      #rm -rf $TSB_HOME;
      `;
  }

  private async _installMainMaster(callback: any) {
    console.debug(
      '@@@@@@ Start installing template service broker main Master... @@@@@@'
    );
    const { mainMaster } = this.env.getNodesSortedByRole();

    // Step 1. TemplateServiceBroker Namespace 및 ServiceAccount 생성
    mainMaster.cmd = this._step1();
    await mainMaster.exeCmd(callback);

    // Step 2. Role 및 RoleBinding 생성
    mainMaster.cmd = this._step2();
    await mainMaster.exeCmd(callback);

    // Step 3. TemplateServiceBroker Server 생성
    mainMaster.cmd = this._step3();
    await mainMaster.exeCmd(callback);

    // Step 4. TemplateServiceBroker Service 생성
    mainMaster.cmd = this._step4();
    await mainMaster.exeCmd(callback);

    // Step 5. TemplateServiceBroker 등록
    mainMaster.cmd = this._step5();
    await mainMaster.exeCmd(callback);

    console.debug(
      '###### Finish installing template service broker main Master... ######'
    );
  }

  private _step1() {
    return `
    cd ~/${TemplateSeviceBrokerInstaller.INSTALL_HOME}/manifest;
    kubectl create namespace tsb-ns;
    kubectl apply -f tsb_serviceaccount.yaml;
    `;
  }

  private _step2() {
    // FIXME: USER_ID를 hypercloud4-system 서비스 어카운트로 설정함. 변경해야 할수도 있음
    return `
    cd ~/${TemplateSeviceBrokerInstaller.INSTALL_HOME}/manifest;
    export USER_ID=\`kubectl get sa -n hypercloud4-system -o jsonpath='{.items[?(@.metadata.name=="hypercloud4-admin")].metadata.name}'\`;
    sed -i 's|\${USER_ID}|'\${USER_ID}'|g' tsb_rolebinding.yaml
    sed -i 's|\${USER_ID}|'\${USER_ID}'|g' tsb_cluster_rolebinding.yaml;
    kubectl apply -f tsb_role.yaml;
    kubectl apply -f tsb_cluster_role.yaml;
    kubectl apply -f tsb_rolebinding.yaml;
    kubectl apply -f tsb_cluster_rolebinding.yaml;
    `;
  }

  private _step3() {
    let script = ``;
    if (this.env.registry) {
      script += `
      sed -i 's| tmaxcloudck| '${this.env.registry}'|g' tsb_deployment.yaml;
      `;
    }
    return `
    cd ~/${TemplateSeviceBrokerInstaller.INSTALL_HOME}/manifest;
    ${script}
    kubectl apply -f tsb_deployment.yaml;
    `;
  }

  private _step4() {
    return `
    cd ~/${TemplateSeviceBrokerInstaller.INSTALL_HOME}/manifest;
    kubectl apply -f tsb_service.yaml
    `;
  }

  private _step5() {
    return `
    cd ~/${TemplateSeviceBrokerInstaller.INSTALL_HOME}/manifest;
    export SERVICE_BROKER_EXTERNAL_IP=\`kubectl get svc -n tsb-ns -o jsonpath='{.items[?(@.metadata.name=="template-service-broker-service")].status.loadBalancer.ingress[0].ip}'\`;
    sed -i 's/{SERVER_IP}/'\${SERVICE_BROKER_EXTERNAL_IP}'/g' tsb_service_broker.yaml;
    kubectl apply -f tsb_service_broker.yaml;
    `;
  }

  private async _removeMainMaster() {
    console.debug('@@@@@@ Start remove console main Master... @@@@@@');
    const { mainMaster } = this.env.getNodesSortedByRole();
    mainMaster.cmd = this._getRemoveScript();
    await mainMaster.exeCmd();
    console.debug('###### Finish remove console main Master... ######');
  }

  private _getRemoveScript(): string {
    // 설치 역순
    return `
    cd ~/${TemplateSeviceBrokerInstaller.INSTALL_HOME}/manifest;
    kubectl delete -f tsb_service_broker.yaml;
    kubectl delete -f tsb_service.yaml
    kubectl delete -f tsb_deployment.yaml;

    kubectl delete -f tsb_cluster_rolebinding.yaml;
    kubectl delete -f tsb_rolebinding.yaml;
    kubectl delete -f tsb_cluster_role.yaml;
    kubectl delete -f tsb_role.yaml;

    kubectl delete -f tsb_serviceaccount.yaml;
    kubectl delete namespace tsb-ns;
    rm -rf ~/${TemplateSeviceBrokerInstaller.INSTALL_HOME};
    `;
  }

  // private async _downloadYaml() {
  //   console.debug('@@@@@@ Start download yaml file from external... @@@@@@');
  //   const { mainMaster } = this.env.getNodesSortedByRole();
  //   mainMaster.cmd = `
  //   mkdir -p ~/${TemplateSeviceBrokerInstaller.INSTALL_HOME};
  //   cd ~/${TemplateSeviceBrokerInstaller.INSTALL_HOME};
  //   wget https://storage.googleapis.com/tekton-releases/triggers/previous/v0.4.0/release.yaml -O tekton-triggers-v0.4.0.yaml;
  //   `;
  //   await mainMaster.exeCmd();
  //   console.debug('###### Finish download yaml file from external... ######');
  // }
}
