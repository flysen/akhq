import React from 'react';
import Table from '../../../../components/Table';
import { uriConsumerGroupAcls } from '../../../../utils/endpoints';
import Root from '../../../../components/Root';

class TopicAcls extends Root {
  state = {
    data: [],
    selectedCluster: '',
    loading: true
  };

  componentDidMount() {
    this.getAcls();
  }

  async getAcls() {
    let acls = [];
    const { clusterId, consumerGroupId } = this.props;

    acls = await this.getApi(uriConsumerGroupAcls(clusterId, consumerGroupId));
    this.handleData(acls.data);
  }

  handleData(data) {
    let tableAcls = [];
    data.map(principal =>
      principal.acls.forEach((acl, index) => {
        tableAcls.push({
          id: index,
          group: acl.resource.name || '',
          host: acl.host || '',
          permission: acl.operation || ''
        });
      })
    );
    this.setState({ data: tableAcls, loading: false });
    return tableAcls;
  }

  render() {
    const { data, loading } = this.state;
    return (
      <div>
        <Table
          loading={loading}
          columns={[
            {
              id: 'group',
              accessor: 'group',
              colName: 'Group',
              type: 'text',
              sortable: true
            },
            {
              id: 'host',
              accessor: 'host',
              colName: 'Host',
              type: 'text',
              sortable: true
            },
            {
              id: 'permission',
              accessor: 'permission',
              colName: 'Permissions',
              type: 'text',
              cell: (obj, col) => {
                return (
                  <React.Fragment>
                    <span className="badge bg-secondary">{obj[col.accessor].permissionType}</span>{' '}
                    {obj[col.accessor].operation}
                  </React.Fragment>
                );
              }
            }
          ]}
          data={data}
          updateData={data => {
            this.setState({ data });
          }}
          noContent={
            <tr>
              <td colSpan={3}>
                <div className="alert alert-warning mb-0" role="alert">
                  No ACLS found, or the &quot;authorizer.class.name&quot; parameter is not
                  configured on the cluster.
                </div>
              </td>
            </tr>
          }
        />
      </div>
    );
  }
}

export default TopicAcls;
