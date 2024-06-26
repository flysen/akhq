import React from 'react';
import Table from '../../../../components/Table/Table';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-merbivore_soft';
import 'react-toastify/dist/ReactToastify.css';
import Root from '../../../../components/Root';
import SearchBar from '../../../../components/SearchBar';
import Pagination from '../../../../components/Pagination';
import { handlePageChange, getPageNumber } from '../../../../utils/pagination';
import { uriKsqlDBTables } from '../../../../utils/endpoints';
import { Link } from 'react-router-dom';
import { withRouter } from '../../../../utils/withRouter';

class KsqlDBTables extends Root {
  state = {
    clusterId: '',
    ksqlDBId: '',
    tableData: [],
    loading: true,
    pageNumber: 1,
    totalPageNumber: 1,
    searchData: {
      search: ''
    }
  };

  static getDerivedStateFromProps(nextProps) {
    const clusterId = nextProps.params.clusterId;
    const ksqlDBId = nextProps.params.ksqlDBId;

    return {
      clusterId: clusterId,
      ksqlDBId: ksqlDBId
    };
  }

  componentDidMount() {
    const { searchData, pageNumber } = this.state;
    const query = new URLSearchParams(this.props.location.search);
    this.setState(
      {
        searchData: { search: query.get('search') ? query.get('search') : searchData.search },
        pageNumber: query.get('page') ? parseInt(query.get('page')) : parseInt(pageNumber)
      },
      () => {
        this.getKsqlDBTables();
      }
    );
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.cancelAxiosRequests();
      this.renewCancelToken();

      this.setState({ pageNumber: 1 }, () => {
        this.componentDidMount();
      });
    }
  }

  async getKsqlDBTables(replaceInNavigation = true) {
    const { clusterId, ksqlDBId, pageNumber } = this.state;
    const { search } = this.state.searchData;

    this.setState({ loading: true });

    let response = await this.getApi(uriKsqlDBTables(clusterId, ksqlDBId, search, pageNumber));
    let data = response.data;
    if (data.results) {
      this.handleData(data);
      this.setState({ selectedCluster: clusterId, totalPageNumber: data.page }, () => {
        this.props.router.navigate(
          {
            pathname: `/ui/${this.state.clusterId}/ksqldb/${this.state.ksqlDBId}/tables`,
            search: `search=${this.state.searchData.search}&page=${pageNumber}`
          },
          { replace: replaceInNavigation }
        );
      });
    } else {
      this.setState({ clusterId, tableData: [], totalPageNumber: 0, loading: false });
    }
  }

  handleData = data => {
    const tableData = data.results.map(table => {
      return {
        id: table.name || '',
        topic: table.topic || '',
        keyFormat: table.keyFormat || '',
        valueFormat: table.valueFormat || '',
        windowed: table.isWindowed ? 'Yes' : 'No'
      };
    });

    this.setState({ tableData, loading: false, totalPageNumber: data.page });
  };

  handleSearch = data => {
    const { searchData } = data;
    this.setState({ pageNumber: 1, searchData }, () => {
      this.getKsqlDBTables();
    });
  };

  handlePageChangeSubmission = (value, replaceInNavigation) => {
    let pageNumber = getPageNumber(value, this.state.totalPageNumber);
    this.setState({ pageNumber: pageNumber }, () => {
      this.getKsqlDBTables(replaceInNavigation);
    });
  };

  render() {
    const { clusterId, tableData, loading, searchData, pageNumber, totalPageNumber } = this.state;

    return (
      <div>
        <nav className="navbar navbar-expand-lg navbar-light bg-light me-auto khq-data-filter khq-sticky khq-nav">
          <SearchBar
            showSearch={true}
            search={searchData.search}
            showPagination={true}
            pagination={pageNumber}
            doSubmit={this.handleSearch}
          />

          <Pagination
            pageNumber={pageNumber}
            totalPageNumber={totalPageNumber}
            onChange={handlePageChange}
            onSubmit={value => this.handlePageChangeSubmission(value, false)}
          />
        </nav>

        <Table
          loading={loading}
          columns={[
            {
              id: 'id',
              name: 'id',
              accessor: 'id',
              colName: 'Name',
              type: 'text',
              sortable: true
            },
            {
              id: 'topic',
              name: 'topic',
              accessor: 'topic',
              colName: 'Topic',
              type: 'text',
              sortable: true,
              cell: (obj, col) => {
                return obj[col.accessor] ? (
                  <Link to={`/ui/${clusterId}/topic/${obj[col.accessor]}`}>
                    {obj[col.accessor]}
                  </Link>
                ) : null;
              }
            },
            {
              id: 'keyFormat',
              name: 'keyFormat',
              accessor: 'keyFormat',
              colName: 'Key format',
              type: 'text',
              sortable: true
            },
            {
              id: 'valueFormat',
              name: 'valueFormat',
              accessor: 'valueFormat',
              colName: 'Value format',
              type: 'text',
              sortable: true
            },
            {
              id: 'windowed',
              name: 'windowed',
              accessor: 'windowed',
              colName: 'Is windowed',
              type: 'text',
              sortable: true
            }
          ]}
          data={tableData}
          updateData={data => {
            this.setState({ tableData: data });
          }}
          extraRow
          noStripes
          noContent={'No tables available'}
        />
      </div>
    );
  }
}

export default withRouter(KsqlDBTables);
