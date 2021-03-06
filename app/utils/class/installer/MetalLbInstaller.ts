/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
import * as scp from '../../common/scp';
import AbstractInstaller from './AbstractInstaller';
import Env, { NETWORK_TYPE } from '../Env';
import * as common from '../../common/common';
import Node from '../Node';
import ScriptFactory from '../script/ScriptFactory';
import CONST from '../../constants/constant';

export default class MetalLbInstaller extends AbstractInstaller {
  public static readonly DIR = `install-metallb`;

  public static readonly INSTALL_HOME = `${Env.INSTALL_ROOT}/${MetalLbInstaller.DIR}`;

  public static readonly IMAGE_HOME = `${MetalLbInstaller.INSTALL_HOME}/image`;

  public static readonly METALLB_VERSION = `0.8.2`;

  // singleton
  private static instance: MetalLbInstaller;

  private constructor() {
    super();
  }

  static get getInstance() {
    if (!MetalLbInstaller.instance) {
      MetalLbInstaller.instance = new MetalLbInstaller();
    }
    return this.instance;
  }

  /**
   * abstract 메서드 구현부
   */
  public async install(param: {
    data: Array<string>;
    callback: any;
    setProgress: Function;
  }) {
    const { data, callback, setProgress } = param;

    setProgress(10);
    await this.preWorkInstall({
      callback
    });
    setProgress(60);
    await this._installMainMaster(data, callback);
    setProgress(100);
  }

  public async remove() {
    await this._removeMainMaster();
  }

  protected async preWorkInstall(param: { callback: any }) {
    console.debug('@@@@@@ Start pre-installation... @@@@@@');
    const { callback } = param;
    // await this._copyFile(callback);
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
    } else if (this.env.networkType === NETWORK_TYPE.EXTERNAL) {
      // external network 경우 해주어야 할 작업들
      /**
       * 1. public 패키지 레포 등록, 설치 (각 노드) (필요 시)
       * 2. git guide clone (마스터 노드)
       */
      await this.cloneGitFile(callback);
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
    // TODO: download kubernetes image file
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
    const srcPath = `${Env.LOCAL_INSTALL_ROOT}/${MetalLbInstaller.DIR}/`;
    await scp.sendFile(mainMaster, srcPath, `${MetalLbInstaller.IMAGE_HOME}/`);
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
    mainMaster.cmd = script.cloneGitFile(CONST.METAL_LB_REPO, CONST.GIT_BRANCH);
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
    mainMaster.cmd += this._getImagePathEditScript();
    await mainMaster.exeCmd(callback);
    console.debug(
      '###### Finish pushing the image at main master node... ######'
    );
  }

  protected getImagePushScript(): string {
    let gitPullCommand = `
    mkdir -p ~/${MetalLbInstaller.IMAGE_HOME};
    export METALLB_HOME=~/${MetalLbInstaller.IMAGE_HOME};
    export METALLB_VERSION=v${MetalLbInstaller.METALLB_VERSION};
    export REGISTRY=${this.env.registry};
    cd $METALLB_HOME;
    `;
    if (this.env.networkType === NETWORK_TYPE.INTERNAL) {
      gitPullCommand += `
      sudo docker load < metallb-controller_\${METALLB_VERSION}.tar
      sudo docker load < metallb-speaker_\${METALLB_VERSION}.tar
      `;
    } else {
      gitPullCommand += `
      sudo docker pull metallb/controller:\${METALLB_VERSION}
      sudo docker pull metallb/speaker:\${METALLB_VERSION}
      # curl https://raw.githubusercontent.com/tmax-cloud/hypercloud-install-guide/master/MetalLB/metallb_v${MetalLbInstaller.METALLB_VERSION}.yaml > metallb.yaml;
      # curl https://raw.githubusercontent.com/tmax-cloud/hypercloud-install-guide/master/MetalLB/metallb_cidr.yaml > metallb_cidr.yaml;
      `;
    }
    return `
      ${gitPullCommand}
      sudo docker tag metallb/controller:\${METALLB_VERSION} \${REGISTRY}/metallb/controller:\${METALLB_VERSION}
      sudo docker tag metallb/speaker:\${METALLB_VERSION} \${REGISTRY}/metallb/speaker:\${METALLB_VERSION}

      sudo docker push \${REGISTRY}/metallb/controller:\${METALLB_VERSION}
      sudo docker push \${REGISTRY}/metallb/speaker:\${METALLB_VERSION}
      #rm -rf $METALLB_HOME;
      `;
  }

  /**
   * private 메서드
   */
  private _getImagePathEditScript(): string {
    // git guide에 내용 보기 쉽게 변경해놓음 (공백 유지해야함)
    return `
    cd ~/${MetalLbInstaller.INSTALL_HOME}/manifest;
    sed -i 's| metallb/speaker| '${this.env.registry}'/metallb/speaker|g' metallb_v${MetalLbInstaller.METALLB_VERSION}.yaml;
    sed -i 's| metallb/controller| '${this.env.registry}'/metallb/controller|g' metallb_v${MetalLbInstaller.METALLB_VERSION}.yaml;
    `;
  }

  private async _installMainMaster(data: Array<string>, callback: any) {
    console.debug('@@@@@@ Start installing main Master... @@@@@@');
    const { mainMaster } = this.env.getNodesSortedByRole();
    // await this.setYaml(mainMaster, data);
    mainMaster.cmd = this._getInstallScript(data);
    await mainMaster.exeCmd(callback);
    console.debug('###### Finish installing main Master... ######');
  }

  private async _removeMainMaster() {
    console.debug('@@@@@@ Start remove main Master... @@@@@@');
    const { mainMaster } = this.env.getNodesSortedByRole();
    mainMaster.cmd = this._getRemoveScript();
    await mainMaster.exeCmd();
    console.debug('###### Finish remove main Master... ######');
  }

  // private async setYaml(mainMaster: Node, data: Array<string>) {
  //   // yaml파일이 config부분에 내용을 바꿔야 해서 객체형태로 수정 하지 못 함
  //   const metallbCidrYamlObj = await common.getYamlObjectByYamlFilePath(
  //     `~/${MetalLbInstaller.INSTALL_HOME}/metallb_cidr.yaml`,
  //     mainMaster
  //   );
  //   console.error(metallbCidrYamlObj);
  // }

  private _getInstallScript(data: Array<string>) {
    return `
      cd ~/${MetalLbInstaller.INSTALL_HOME}/manifest;
      sed -i 's/v0.8.2/'v${MetalLbInstaller.METALLB_VERSION}'/g' metallb_v${
      MetalLbInstaller.METALLB_VERSION
    }.yaml;
      ${this._setMetalLbArea(data)}
      kubectl apply -f metallb_v${MetalLbInstaller.METALLB_VERSION}.yaml;
      kubectl apply -f metallb_cidr.yaml;
      `;
  }

  private _getRemoveScript(): string {
    return `
    cd ~/${MetalLbInstaller.INSTALL_HOME}/manifest;
    kubectl delete -f metallb_v${MetalLbInstaller.METALLB_VERSION}.yaml;
    kubectl delete -f metallb_cidr.yaml;
    rm -rf ~/${MetalLbInstaller.INSTALL_HOME};
    `;
  }

  private _setMetalLbArea(data: Array<string>): string {
    let ipRangeText = '';
    for (let i = 0; i < data.length; i += 1) {
      ipRangeText = ipRangeText.concat(`          - ${data[i]}\\n`);
    }
    console.error('ipRangeText', ipRangeText);
    // FIXME: sed 값 변경 될 가능성 있음
    return `
    # interfaceName=\`ip -o -4 route show to default | awk '{print $5}'\`;
    # inet=\`ip -f inet addr show \${interfaceName} | awk '/inet /{ print $2}'\`;
    # network=\`ipcalc -n \${inet} | cut -d"=" -f2\`;
    # prefix=\`ipcalc -p \${inet} | cut -d"=" -f2\`;
    # networkArea=\${network}/\${prefix};
    sed -i 's|          - \${ADDRESS-POOL}|${ipRangeText}|g' metallb_cidr.yaml;
    sed -i 's|\\r$||g' metallb_cidr.yaml;
    `;
  }

  // private async _copyFile(callback: any) {
  //   console.debug('@@@@@@ Start copy yaml file... @@@@@@');
  //   const { mainMaster } = this.env.getNodesSortedByRole();
  //   mainMaster.cmd = `
  //   ${common.getCopyCommandByFilePath(
  //     `~/${MetalLbInstaller.INSTALL_HOME}/metallb_v${MetalLbInstaller.METALLB_VERSION}.yaml`
  //   )}
  //   ${common.getCopyCommandByFilePath(
  //     `~/${MetalLbInstaller.INSTALL_HOME}/metallb_cidr.yaml`
  //   )}
  //   `;
  //   await mainMaster.exeCmd(callback);
  //   console.debug('###### Finish copy yaml file... ######');
  // }
}
