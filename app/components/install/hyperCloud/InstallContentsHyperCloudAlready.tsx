import React, { useContext } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton
} from '@material-ui/core';
import MuiBox from '@material-ui/core/Box';
import CloseIcon from '@material-ui/icons/Close';
import { shell } from 'electron';
import styles from '../InstallContents1.css';
import { AppContext } from '../../../containers/AppContext';
import CONST from '../../../utils/constants/constant';
import productImage from '../../../../resources/assets/HyperCloud Operator_logo.png';
import FinishImage from '../../../../resources/assets/img_finish_blue.svg';
import * as env from '../../../utils/common/env';
import routes from '../../../utils/constants/routes.json';
import HyperCloudOperatorInstaller from '../../../utils/class/installer/HyperCloudOperatorInstaller';
import HyperCloudConsoleInstaller from '../../../utils/class/installer/HyperCloudConsoleInstaller';
import HyperCloudWebhookInstaller from '../../../utils/class/installer/HyperCloudWebhookInstaller';
import TemplateSeviceBrokerInstaller from '../../../utils/class/installer/TemplateSeviceBrokerInstaller';

function InstallContentsHyperCloudAlready(props: any) {
  console.debug(InstallContentsHyperCloudAlready.name, props);
  const { history, match } = props;

  const appContext = useContext(AppContext);
  const { dispatchAppState } = appContext;

  const nowEnv = env.loadEnvByName(match.params.envName);
  const nowProduct = CONST.PRODUCT.HYPERCLOUD;
  const product = nowEnv.isInstalled(nowProduct.NAME);

  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const defaultProps = {
    bgcolor: 'background.paper',
    borderColor: 'text.primary',
    m: 1,
    border: 1,
    style: { width: '20rem', height: '20rem' }
  };

  const remove = async () => {
    console.debug(`nowEnv`, nowEnv);

    // console delete
    const hyperCloudConsoleInstaller = HyperCloudConsoleInstaller.getInstance;
    hyperCloudConsoleInstaller.env = nowEnv;
    await hyperCloudConsoleInstaller.remove();

    // webhook delete
    const hyperCloudWebhookInstaller = HyperCloudWebhookInstaller.getInstance;
    hyperCloudWebhookInstaller.env = nowEnv;
    await hyperCloudWebhookInstaller.remove();

    // operator delete
    const hyperCloudOperatorInstaller = HyperCloudOperatorInstaller.getInstance;
    hyperCloudOperatorInstaller.env = nowEnv;
    await hyperCloudOperatorInstaller.remove();

    // template service broker delete
    const templateSeviceBrokerInstaller =
      TemplateSeviceBrokerInstaller.getInstance;
    templateSeviceBrokerInstaller.env = nowEnv;
    await templateSeviceBrokerInstaller.remove();

    // webhook delete
    // kube-apiserver.yaml 수정부분은 맨 마지막에 수행
    // api server재기동에 시간이 걸려서, 다음 명령에서 kubectl이 동작하지 않음
    await hyperCloudWebhookInstaller.rollbackApiServerYaml();
  };

  const getNetworkJsx = state => {
    let jsx;
    if (state.isUseIngress) {
      jsx = (
        <div style={{ marginBottom: '30px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>- 인그레스</span>
            <span>사용함</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>- 인그레스 컨트롤러</span>
            <span>
              {state.sharedIngress ? '사용자 공용' : ''}
              {state.sharedIngress && state.systemIngress ? ',' : ''}
              {state.systemIngress ? '시스템' : ''}
            </span>
          </div>
        </div>
      );
    } else {
      jsx = (
        <div style={{ marginBottom: '30px' }}>
          <span>- 인그레스</span>
          <span>사용안함</span>
        </div>
      );
    }
    return jsx;
  };

  return (
    <div className={[styles.wrap, 'childLeftRightCenter'].join(' ')}>
      <div>
        <div className={styles.contents}>
          <div className="childLeftRightCenter">
            <MuiBox
              className={[
                'childUpDownCenter',
                'childLeftRightCenter',
                styles.installedCircle
              ].join(' ')}
              borderRadius="50%"
              {...defaultProps}
            >
              <img
                className={[styles.installedImage].join(' ')}
                src={FinishImage}
                alt="Logo"
              />
              <div className={[styles.insideCircle].join(' ')}>
                <div>
                  <img src={productImage} alt="Logo" />
                </div>
                <div>
                  <span className={['large', 'thick'].join(' ')}>
                    {nowProduct.NAME}
                  </span>
                </div>
                <div>
                  <span className={['small', 'lightDark'].join(' ')}>
                    {nowProduct.DESC}
                  </span>
                </div>
              </div>
            </MuiBox>
          </div>
          <div>
            <div>
              <span className={['medium', 'thick'].join(' ')}>
                Operator Version
              </span>
            </div>
            <div>
              <span className={['medium', 'lightDark'].join(' ')}>
                {product.operator_version}
              </span>
            </div>
          </div>
          <div>
            <div>
              <span className={['medium', 'thick'].join(' ')}>
                Webhook Version
              </span>
            </div>
            <div>
              <span className={['medium', 'lightDark'].join(' ')}>
                {product.webhook_version}
              </span>
            </div>
          </div>
          <div>
            <div>
              <span className={['medium', 'thick'].join(' ')}>
                Console Version
              </span>
            </div>
            <div>
              <span className={['medium', 'lightDark'].join(' ')}>
                {product.console_version}
              </span>
            </div>
          </div>
          <div>
            <div>
              <span className={['medium', 'thick'].join(' ')}>네트워크</span>
            </div>
            <div>
              <span className={['lightDark'].join(' ')}>
                {getNetworkJsx(product)}
              </span>
            </div>
          </div>
          <div>
            <div>
              <span className={['medium', 'thick'].join(' ')}>관리자 계정</span>
            </div>
            <div>
              <span className={['medium', 'lightDark'].join(' ')}>
                {product.email}
              </span>
            </div>
          </div>
          <div>
            <span className={['small', 'indicator'].join(' ')}>
              <a
                onClick={async () => {
                  const { mainMaster } = nowEnv.getNodesSortedByRole();
                  mainMaster.cmd = `kubectl get svc -n console-system -o jsonpath='{.items[?(@.metadata.name=="console-lb")].status.loadBalancer.ingress[0].ip}'`;
                  let ip;
                  await mainMaster.exeCmd({
                    close: () => {},
                    stdout: (data: string) => {
                      ip = data.toString();
                    },
                    stderr: () => {}
                  });
                  shell.openExternal(`https://${ip}/`);
                }}
              >
                console로 이동
              </a>
            </span>
          </div>
          <div>
            <span
              style={{ marginRight: '5px' }}
              className={['small', 'lightDark'].join(' ')}
            >
              더 이상 사용하지 않는다면?
            </span>
            <span className={['small', 'indicator'].join(' ')}>
              <a
                onClick={() => {
                  handleClickOpen();
                }}
              >
                삭제
              </a>
            </span>
          </div>
        </div>
        <div>
          <div>
            <Dialog
              open={open}
              onClose={handleClose}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">
                삭제
                <IconButton
                  style={{
                    position: 'absolute',
                    right: '5px',
                    top: '5px'
                  }}
                  aria-label="close"
                  onClick={handleClose}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  <span className={['lightDark', 'small'].join(' ')}>
                    {CONST.PRODUCT.HYPERCLOUD.NAME} 를 삭제하시겠습니까?
                  </span>
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button
                  className={['primary'].join(' ')}
                  onClick={async () => {
                    try {
                      dispatchAppState({
                        type: 'set_loading',
                        loading: true
                      });
                      handleClose();
                      await remove();
                      nowEnv.deleteProductByName(nowProduct.NAME);
                      env.updateEnv(nowEnv.name, nowEnv);
                      history.push(
                        `${routes.INSTALL.HOME}/${nowEnv.name}/main`
                      );
                    } catch (error) {
                      console.error(error);
                    } finally {
                      dispatchAppState({
                        type: 'set_loading',
                        loading: false
                      });
                    }
                  }}
                >
                  삭제
                </Button>
                <Button
                  className={['secondary'].join(' ')}
                  onClick={handleClose}
                  autoFocus
                >
                  취소
                </Button>
              </DialogActions>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstallContentsHyperCloudAlready;
