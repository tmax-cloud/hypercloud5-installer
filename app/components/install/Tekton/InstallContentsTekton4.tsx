import React from 'react';
import { Button } from '@material-ui/core';
import styles from '../InstallContents4.css';
import * as env from '../../../utils/common/env';
import FinishImage from '../../../../resources/assets/img_finish_blue.svg';
import routes from '../../../utils/constants/routes.json';

function InstallContentsTekton4(props: any) {
  console.debug(InstallContentsTekton4.name, props);
  const { history, match, state } = props;

  const nowEnv = env.loadEnvByName(match.params.envName);

  const getRegistryJsx = () => {
    if (state.type) {
      return (
        <div style={{ marginBottom: '30px' }}>
          <div>
            <span className={['medium', 'thick'].join(' ')}>Type</span>
          </div>
          <div>
            <span className={['medium', 'lightDark'].join(' ')}>
              {state.type}
            </span>
          </div>
        </div>
      );
    }
    return <></>;
  };
  return (
    <div className={[styles.wrap, 'childLeftRightCenter'].join(' ')}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '50px' }}>
          <img src={FinishImage} alt="Logo" />
        </div>
        <div style={{ marginBottom: '30px' }}>
          <div>
            <span className={['medium', 'thick'].join(' ')}>
              Pipeline Version
            </span>
          </div>
          <div>
            <span className={['medium', 'lightDark'].join(' ')}>
              {state.pipeline_version}
            </span>
          </div>
        </div>
        <div style={{ marginBottom: '30px' }}>
          <div>
            <span className={['medium', 'thick'].join(' ')}>
              Trigger Version
            </span>
          </div>
          <div>
            <span className={['medium', 'lightDark'].join(' ')}>
              {state.trigger_version}
            </span>
          </div>
        </div>
        <div style={{ marginBottom: '30px' }}>
          <div>
            <span className={['medium', 'thick'].join(' ')}>
              Approval Version
            </span>
          </div>
          <div>
            <span className={['medium', 'lightDark'].join(' ')}>
              {state.approval_version}
            </span>
          </div>
        </div>
        <div style={{ marginBottom: '30px' }}>
          <div>
            <span className={['medium', 'thick'].join(' ')}>
              Mail-notifier Version
            </span>
          </div>
          <div>
            <span className={['medium', 'lightDark'].join(' ')}>
              {state.mailNotifier_version}
            </span>
          </div>
        </div>
        <div style={{ marginBottom: '30px' }}>
          <div>
            <span className={['medium', 'thick'].join(' ')}>
              CI/CD Templates Version
            </span>
          </div>
          <div>
            <span className={['medium', 'lightDark'].join(' ')}>
              {state.cicdTemplates_version}
            </span>
          </div>
        </div>
        {getRegistryJsx()}
        <div>
          <Button
            variant="contained"
            className={['secondary'].join(' ')}
            size="large"
            onClick={() => {
              history.push(`${routes.INSTALL.HOME}/${nowEnv.name}/main`);
            }}
          >
            완료
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InstallContentsTekton4;
