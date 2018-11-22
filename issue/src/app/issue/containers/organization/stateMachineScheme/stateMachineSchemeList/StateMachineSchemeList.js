import React, { Component, Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  Icon,
  Tooltip,
  message,
} from 'choerodon-ui';
import { injectIntl, FormattedMessage } from 'react-intl';
import {
  Content,
  Header,
  Page,
  Permission,
  stores,
} from 'choerodon-front-boot';
import '../../../main.scss';
import './StateMachineSchemeList.scss';
import TypeTag from "../../../../components/TypeTag/TypeTag";

const { AppState } = stores;
const prefixCls = 'issue-stateMachineScheme';
const { Sidebar } = Modal;
const FormItem = Form.Item;
const { TextArea } = Input;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 100 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 26 },
  },
};

@observer
class StateMachineSchemeList extends Component {
  constructor(props) {
    const menu = AppState.currentMenuType;
    super(props);
    this.state = {
      show: false,
      submitting: false,
      deleteId: 0,
      deleteItemName: '',
    };
  }

  componentDidMount() {
    const { name, id, organizationId } = AppState.currentMenuType;
    this.props.StateMachineSchemeStore.loadStateMachineSchemeList(organizationId);
  }

  getColumns = () => [
    {
      title: <FormattedMessage id="stateMachineScheme.name" />,
      dataIndex: 'name',
      key: 'name',
      filters: [],
    },
    {
      title: <FormattedMessage id="stateMachineScheme.des" />,
      dataIndex: 'description',
      key: 'description',
      className: 'issue-table-ellipsis',
      filters: [],
    },
    {
      title: <FormattedMessage id="stateMachineScheme.project" />,
      dataIndex: 'project',
      key: 'project',
      filters: [],
      render: (text, record) => (
        record.projectDTOs && record.projectDTOs.map(project => (
          <div>
            {`• ${project.name}`}
          </div>
        ))
      ),
    },
    {
      title: (
        <div className={`${prefixCls}-table-title`}>
          <span className={`${prefixCls}-table-issueType`}>
            <FormattedMessage id="stateMachineScheme.issueType" />
          </span>
          <span className={`${prefixCls}-table-stateMachine`}>
            <FormattedMessage id="stateMachineScheme.stateMachine" />
          </span>
        </div>
      ),
      width: 500,
      dataIndex: 'related',
      key: 'related',
      render: (text, record) => record.configDTOs && record.configDTOs
        .map(configDTO => (
          <Fragment key={configDTO.id}>
            <div className={`${prefixCls}-table-related`}>
              <span className={`${prefixCls}-table-issueType`}>
                <TypeTag
                  data={{
                    colour: configDTO.issueTypeColour,
                    name: configDTO.issueTypeName,
                    icon: configDTO.issueTypeIcon,
                  }}
                  showName
                />
                <Icon
                  type="arrow_forward"
                  style={{ verticalAlign: 'top', marginLeft: 10 }}
                />
              </span>
              <span className={`${prefixCls}-table-stateMachine-content`}>
                {configDTO.stateMachineName}
              </span>
            </div>
          </Fragment>
        )),
    },
    {
      title: <FormattedMessage id="stateMachineScheme.operation" />,
      width: 104,
      key: 'action',
      render: record => (
        <Fragment>
          <Tooltip
            placement="bottom"
            title={<FormattedMessage id="edit" />}
          >
            <Button size="small" shape="circle" onClick={this.handleEdit.bind(this, record)}>
              <i className="icon icon-mode_edit" />
            </Button>
          </Tooltip>
          {record.status === 'create'
            ? <Tooltip
              placement="bottom"
              title={<FormattedMessage id="delete" />}
            >
              <Button size="small" shape="circle" onClick={this.handleDelete.bind(this, record.id, record.name)}>
                <i className="icon icon-delete" />
              </Button>
            </Tooltip> : <div className="issue-del-space" />
          }
        </Fragment>
      ),
    },
  ];

  showSideBar = (state, id = '') => {
    this.props.form.resetFields();
    this.setState({
      show: true,
      type: state,
    });
  };

  hideSidebar = () => {
    this.setState({
      show: false,
      type: '',
    });
  };

  handleEdit = (record) => {
    const { StateMachineSchemeStore, intl, history } = this.props;
    const { name, id, organizationId } = AppState.currentMenuType;
    // StateMachineSchemeStore.loadStateMachine(organizationId, id);
    history.push(`/issue/state-machine-schemes/edit/${record.id}?type=organization&id=${id}&name=${encodeURIComponent(name)}&organizationId=${organizationId}`);
  };

  handleDelete = (deleteId, deleteItemName) => {
    const { StateMachineSchemeStore } = this.props;
    this.setState({
      deleteId,
      deleteItemName,
    });
    StateMachineSchemeStore.setIsSchemeDeleteVisible(true);
  };

  confirmDelete = (schemeId) => {
    const { organizationId } = AppState.currentMenuType;
    const { StateMachineSchemeStore, intl } = this.props;
    StateMachineSchemeStore.deleteStateMachineScheme(organizationId, schemeId).then((data) => {
      if (data) {
        message.success(intl.formatMessage({ id: 'deleteSuccess' }));
      } else {
        message.error(intl.formatMessage({ id: 'deleteFailed' }));
      }
      StateMachineSchemeStore.setIsSchemeDeleteVisible(false);
      this.refresh();
    }).catch((error) => {
      message.error(intl.formatMessage({ id: 'deleteFailed' }));
      this.closeRemove();
    });
  };

  cancelDelete = (e) => {
    const { StateMachineSchemeStore } = this.props;
    StateMachineSchemeStore.setIsSchemeDeleteVisible(false);
  };

  handleSubmit = (e) => {
    const { organizationId } = AppState.currentMenuType;
    e.preventDefault();
    const { form, StateMachineSchemeStore } = this.props;
    form.validateFields((err, stateMachineScheme) => {
      if (!err) {
        StateMachineSchemeStore.createStateMachineScheme(stateMachineScheme, organizationId);
        this.hideSidebar();
      }
    });
  };

  loadStateMachineSchemeList = (pagination, sort = { field: 'id', order: 'desc' }, param) => {
    const { StateMachineSchemeStore } = this.props;
    const orgId = AppState.currentMenuType.organizationId;
    StateMachineSchemeStore.loadStateMachineSchemeList(orgId, pagination, sort, { ...param });
  };

  refresh = () => {
    const { sorter, tableParam } = this.state;
    const { pagination } = this.props.StateMachineSchemeStore;
    this.loadStateMachineSchemeList(pagination, sorter, tableParam);
  }

  tableChange = (pagination, filters, sorter, param) => {
    const orgId = AppState.currentMenuType.organizationId;
    const sort = {};
    if (sorter.column) {
      const { field, order } = sorter;
      sort[field] = order;
    }
    let searchParam = {};
    if (Object.keys(filters).length) {
      searchParam = filters;
    }
    const postData = {
      ...searchParam,
      param: param.toString(),
    };
    this.setState({
      sorter: sorter.column ? sorter : undefined,
      tableParam: postData,
    });
    this.loadStateMachineSchemeList(pagination,
      sorter.column ? sorter : undefined,
      postData);
  };

  render() {
    const { StateMachineSchemeStore, intl, form } = this.props;
    const {
      pagination,
      getIsLoading,
      getStateMachineSchemeList,
    } = StateMachineSchemeStore;

    // const { page, pageSize, singleData } = this.state;
    const { getFieldDecorator } = form;
    const menu = AppState.currentMenuType;
    const { type, id: projectId, organizationId: orgId } = menu;
    const formContent = (
      <div className="issue-region">
        <Form layout="vertical" className="issue-sidebar-form">
          {this.state.type === 'create' && (
            <FormItem {...formItemLayout}>
              {getFieldDecorator('name', {
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    max: 47,
                    message: intl.formatMessage({ id: 'required' }),
                  }],
              })(
                <Input
                  placeholder={
                    <FormattedMessage id="stateMachineScheme.createName" />
                  }
                  style={{ width: 520 }}
                  label={<FormattedMessage id="stateMachineScheme.name" />}
                  size="default"
                />,
              )}
            </FormItem>
          )}
          <FormItem {...formItemLayout} className="issue-sidebar-form">
            {getFieldDecorator('description')(
              <TextArea
                placeholder={intl.formatMessage({
                  id: 'stateMachineScheme.createDes',
                })}
                style={{ width: 520 }}
                label={<FormattedMessage id="stateMachineScheme.des" />}
              />,
            )}
          </FormItem>
        </Form>
      </div>
    );

    return (
      <Page>
        <Header title={<FormattedMessage id="stateMachineScheme.title" />}>
          <Button onClick={() => this.showSideBar('create')}>
            <i className="icon-add icon" />
            <FormattedMessage id="stateMachineScheme.create" />
          </Button>
          <Button onClick={this.refresh}>
            <i className="icon-refresh icon" />
            <FormattedMessage id="refresh" />
          </Button>
        </Header>
        <Content>
          <Table
            dataSource={getStateMachineSchemeList}
            rowClassName={`${prefixCls}-table-col`}
            columns={this.getColumns()}
            filterBarPlaceholder={intl.formatMessage({ id: 'filter' })}
            rowKey={record => record.id}
            pagination={pagination}
            onChange={this.tableChange}
            loading={getIsLoading}
            className="issue-table"
          />
        </Content>
        <Modal
          title={<FormattedMessage id="stateMachineScheme.delete" />}
          visible={this.props.StateMachineSchemeStore.getIsSchemeDeleteVisible}
          onOk={this.confirmDelete.bind(this, this.state.deleteId)}
          onCancel={this.cancelDelete}
          center
        >
          <p className={`${prefixCls}-del-content`}>
            <FormattedMessage id="stateMachineScheme.delete" />
            <span>:</span>
            <span className={`${prefixCls}-del-content-name`}>{this.state.deleteItemName}</span>
          </p>
          <p className={`${prefixCls}-del-tip`}>
            <FormattedMessage id="stateMachineScheme.deleteDesAfter" />
          </p>
          {/* <p>
            {
              <Fragment>
                <FormattedMessage id="stateMachineScheme.deleteDesBefore" />
                <strong>{this.state.deleteItemName}</strong>
                <FormattedMessage id="stateMachineScheme.deleteDesAfter" />
              </Fragment>
            }
          </p> */}
        </Modal>
        {this.state.show && (
          <Sidebar
            title={<FormattedMessage id="stateMachineScheme.create" />}
            onOk={this.handleSubmit}
            visible={this.state.show}
            okText={
              <FormattedMessage
                id={this.state.type === 'create' ? 'create' : 'save'}
              />
            }
            cancelText={<FormattedMessage id="cancel" />}
            confirmLoading={this.state.submitting}
            onCancel={this.hideSidebar}
          >
            {formContent}
          </Sidebar>
        )}
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(StateMachineSchemeList)));
