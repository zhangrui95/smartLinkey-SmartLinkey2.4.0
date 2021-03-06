import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import {
  Card,
  Icon,
  Avatar,
  Tag,
  Spin,
  Tooltip,
  message,
  Drawer,
  Button,
  Checkbox,
  DatePicker,
  Radio,
  Modal,
  Row,
  Col,
  Input,
  Form,
} from 'antd';
import { aes_decrypt } from '../../utils/encrypt';
const { MonthPicker, RangePicker, WeekPicker } = DatePicker;
const CheckboxGroup = Checkbox.Group;
const RadioGroup = Radio.Group;
const { TextArea } = Input;
const FormItem = Form.Item;
import TagSelect from 'ant-design-pro/lib/TagSelect';
const { Meta } = Card;
import styles from './SmartDetail.less';
import { getLocalTime, autoheight } from '../../utils/utils';
import { ipcRenderer } from 'electron';
import SmartDetailItem from './SmartDetailItem';
import TableDetail from './newsDetail/TableDetail';
import SmartItem from './SmartItem';
@Form.create()
@connect(({ user, login, save }) => ({
  user,
  login,
  save,
}))
export default class SmartDetail extends Component {
  constructor(props) {
    //初始化nowPage为1
    super(props);
    const user = sessionStorage.getItem('user');
    const userNew = JSON.parse(user).user;
    let agxt = false;
    JSON.parse(user).menu.map(item => {
      if (item.resourceCode === 'zhag_btn') {
        agxt = true;
      }
    });
    this.state = {
      // xmppList:[],
      loading: true,
      load: false,
      height: 525,
      data: [],
      scrollHeight: 0,
      sHight: 0,
      startLength: 0,
      endLength: 0,
      pageCount: 5,
      tableCount: 8,
      total: 0,
      resultLength: 0,
      empty: false,
      noSearch: true,
      lookMore: false,
      saveList: [],
      userItem: userNew,
      agxt: agxt,
      visible: false,
      isTable: false,
      detailList: [],
      checkedList: null,
      searchResult: null,
      xtValue: '',
      sxValue: null,
      xzValue: [],
      arrSearch: [],
      timeList: [],
      searchTime: [],
      timeDate: '',
      menu: JSON.parse(user).menu,
      xtly: [{ label: '全部', value: '' }],
      payloadSer: null,
      dateLoading: true,
      searchValue: '',
      dbVisable: false,
      detailVisable: false,
      dbDetail: null,
      connent: '',
      third: [],
      numBoxAnimate: styles.none,
      jobGl: [],
      // oldList:[],
    };
  }
  scrollHandler = this.handleScroll.bind(this);
  componentDidMount() {
    let job = this.state.userItem.job;
    let jobGl = [];
    if (JSON.stringify(job).includes('200002')) {
      jobGl.push(this.state.userItem.department);
    }
    jobGl.push(this.state.userItem.idCard);
    this.setState({
      jobGl: jobGl,
    });
    window.addEventListener('resize', () => {
      this.updateSize();
    });
    this.props.dispatch({
      type: 'user/getConfigGoto',
      callback: response => {
        this.setState({
          third: response.third,
          configSys: response.system,
        });
        ipcRenderer.send('huaci-config', response);
        response.third.map((event, i) => {
          this.state.menu.map(item => {
            if (item.resourceCode === event.unique) {
              this.state.xtly.push({ label: event.name, value: event.unique });
            }
          });
        });
      },
    });
  }
  componentWillReceiveProps(next) {
    if (this.props.unreadCount !== next.unreadCount && next.unreadCount > 5) {
      this.setState({
        numBoxAnimate: styles.fadeInRight,
      });
    }
    if (
      this.props.newMsg !== next.newMsg ||
      this.props.user.value !== next.user.value ||
      (next.msg_key_str && this.props.msg_key_str !== next.msg_key_str)
    ) {
      this.changeList();
    }
  }
  changeList = () => {
    this.setState({
      endLength: 0,
      searchValue: this.props.user.value,
    });
    let payloads = {
      idcard: this.state.jobGl,
      size: this.state.isTable ? this.state.tableCount : this.state.pageCount,
      page: 0,
      timeStart: '',
      timeEnd: '',
      contain: this.props.user.value,
      systemId: '',
      messageStatus: [],
    };
    if (this.state.payloadSer) {
      this.state.payloadSer.page = 0;
      this.state.payloadSer.size = this.state.isTable
        ? this.state.tableCount
        : this.state.pageCount;
      this.state.payloadSer.contain = this.props.user.value;
    }
    this.getSocketList(true, null, this.state.payloadSer ? this.state.payloadSer : payloads);
  };
  getUnRead = (page, goTop, unreadCount, scrollHeight) => {
    if (goTop) {
      this.setState({
        detailList: [],
      });
    }
    this.setState({
      unreadCount: unreadCount,
    });
    this.props.dispatch({
      type: 'user/unReadQuery',
      payload: {
        idcard: this.state.jobGl,
        size: 10,
        page: page,
        count: unreadCount,
      },
      callback: res => {
        let key = this.props.msg_key_str
          ? this.props.msg_key_str.split(',').map(item => parseInt(item))
          : '';
        let response = JSON.parse(aes_decrypt(key, res.cipher));
        if (response.data && response.data.length > 0) {
          response.data.map(item => {
            if (unreadCount > this.props.unreadCount) {
              this.state.detailList.unshift(item);
            } else {
              this.state.detailList.push(item);
            }
          });
          this.setState({
            detailList: this.state.detailList,
            total: response.total,
          });
          if (goTop) {
            this.setState({
              lookMore: true,
              lookNews: '以下为未读消息',
            });
            this.refs.scroll.scrollTop = 10;
          }
          if (scrollHeight && unreadCount > this.props.unreadCount) {
            let sHeight = this.refs.scroll.scrollHeight;
            this.refs.scroll.scrollTop = sHeight - scrollHeight;
          }
          this.refs.scroll.addEventListener('scroll', this.scrollHandler);
        }
      },
    });
  };
  handleOk = () => {
    if (this.state.connent.length < 500 && this.state.connent.length > 0) {
      this.props.getFk(['反馈意见：' + this.state.connent], this.state.dbDetail, this.state.cardTo);
      this.state.third.map((event, i) => {
        if (event.unique === '109005') {
          if (event.api !== '') {
            if (this.state.configSys && this.state.configSys.use_proxy) {
              window.configUrl.questionStatus = `${window.configUrls.serve}/t${event.unique}`;
            } else {
              window.configUrl.questionStatus = event.api;
            }
            this.props.dispatch({
              type: 'user/getQuestionStatus',
              payload: {
                id: this.state.dbDetail.id,
                sfzh: this.state.userItem.idCard,
                name: this.state.userItem.name,
                fkr_fkyj: this.state.connent,
              },
              callback: response => {
                if (!response.error) {
                  message.success('操作成功');
                  this.props.dispatch({
                    type: 'user/getNactive',
                    payload: {
                      uuid: this.state.dbDetail.uuid,
                    },
                    callback: response => {
                      if (!response.error) {
                        let payloads = {
                          idcard: this.state.jobGl,
                          size: this.state.isTable ? this.state.tableCount : this.state.pageCount,
                          page: 0,
                          timeStart: '',
                          timeEnd: '',
                          contain: this.state.searchValue,
                          systemId: '',
                          messageStatus: [],
                        };
                        this.getSocketList(true, null, payloads);
                      }
                    },
                  });
                } else {
                  message.error(response.error.text);
                }
              },
            });
          }
        }
      });
      this.setState({
        dbVisable: false,
      });
    } else {
      if (this.state.connent.length === 0) {
        message.warn('意见不能为空');
      } else {
        message.warn('意见不能超出500字，请重新输入');
      }
    }
  };
  handleCancel = () => {
    this.setState({
      dbVisable: false,
      detailVisable: false,
    });
  };
  getSocketList = (empty, scrollHeight, payloads) => {
    this.props.dispatch({
      type: 'user/SocketQuery',
      payload: payloads,
      callback: res => {
        let key = this.props.msg_key_str
          ? this.props.msg_key_str.split(',').map(item => parseInt(item))
          : '';
        let response = JSON.parse(aes_decrypt(key, res.cipher));
        this.setState({
          loading: false,
          total: response.total,
        });
        let list = [];
        if (response.data && response.data.length > 0) {
          response.data.map((item, i) => {
            if (this.state.isTable) {
              if (empty) {
                list.push(item);
                this.setState({
                  detailList: list,
                });
              } else {
                this.state.detailList.push(item);
                this.setState({
                  detailList: this.state.detailList,
                });
              }
            } else {
              if (empty) {
                list.unshift(item);
                this.setState({
                  detailList: list,
                });
              } else {
                this.state.detailList.unshift(item);
                this.setState({
                  detailList: this.state.detailList,
                });
              }
              let sHeight = this.refs.scroll.scrollHeight;
              if (scrollHeight) {
                this.refs.scroll.scrollTop = sHeight - scrollHeight;
              } else {
                setTimeout(() => {
                  this.refs.scroll.scrollTop = 100000;
                }, 200);
              }
              if (
                response.total < this.state.pageCount * (this.state.endLength + 1) ||
                response.total === this.state.pageCount * (this.state.endLength + 1)
              ) {
                this.refs.scroll.removeEventListener('scroll', this.scrollHandler);
                this.setState({
                  lookMore: false,
                });
              } else {
                this.refs.scroll.addEventListener('scroll', this.scrollHandler);
              }
            }
          });
        } else {
          this.setState({
            detailList: [],
          });
        }
      },
    });
  };
  updateSize() {
    this.setState({
      height: autoheight() < 700 ? autoheight() - 115 : autoheight() - 104,
    });
  }
  _handleScroll(scrollTop) {
    let scrollHeight = this.refs.scroll.scrollHeight;
    let windowHeight = this.refs.scroll.clientHeight;
    let hide = true;
    if (scrollTop === 0) {
      this.setState({
        lookNews: null,
      });
      if (!this.state.isTable) {
        this.refs.scroll.removeEventListener('scroll', this.scrollHandler);
      }
      let _length = 0;
      if (!this.state.lookMore) {
        this.setState({
          lookMore: true,
        });
        this.refs.scroll.scrollTop = 10;
        this.refs.scroll.addEventListener('scroll', this.scrollHandler);
      } else {
        this.setState({
          lookMore: false,
          load: true,
          endLength: parseInt(this.state.endLength) + 1,
        });
        let scrollHeight = this.refs.scroll.scrollHeight ? this.refs.scroll.scrollHeight : 0;
        if (!this.state.goScrollBottom) {
          let payloads = {
            idcard: this.state.jobGl,
            size: this.state.isTable ? this.state.tableCount : this.state.pageCount,
            page: this.state.endLength,
            timeStart: '',
            timeEnd: '',
            contain: this.state.searchValue,
            systemId: '',
            messageStatus: [],
          };
          if (this.state.payloadSer) {
            this.state.payloadSer.page = this.state.endLength;
            this.state.payloadSer.size = this.state.isTable
              ? this.state.tableCount
              : this.state.pageCount;
            this.state.payloadSer.contain = this.props.user.value;
          }
          this.getSocketList(
            false,
            scrollHeight,
            this.state.payloadSer ? this.state.payloadSer : payloads
          );
          let unreadPage = this.props.unreadCount
            ? parseInt(this.props.unreadCount / this.state.pageCount)
            : 0;
          if (unreadPage === this.state.endLength) {
            this.props.getResetUnread();
            this.setState({
              numBoxAnimate: styles.none,
            });
          }
        } else {
          this.getUnRead(this.state.endLength, false, this.state.unreadCount + 10, scrollHeight);
          hide = false;
        }
      }
    }
    if (scrollTop !== 0 && scrollTop + windowHeight === scrollHeight && this.state.goScrollBottom) {
      this.refs.scroll.scrollTop = scrollHeight - 10;
      this.refs.scroll.removeEventListener('scroll', this.scrollHandler);
      this.setState({
        endLength: parseInt(this.state.endLength) + 1,
        lookNews: null,
      });
      this.getUnRead(this.state.endLength, false, this.state.unreadCount);
      if (
        this.state.total > 0 &&
        hide &&
        (this.state.total === 10 * this.state.endLength ||
          this.state.total < 10 * this.state.endLength)
      ) {
        this.setState({
          numBoxAnimate: styles.none,
          endLength: parseInt(this.state.endLength) - 1,
        });
        this.refs.scroll.addEventListener('scroll', this.scrollHandler);
        return false;
      }
    }
  }
  handleScroll(event) {
    this.setState({
      scrollHeight: 0,
    });
    let scrollTop = this.refs.scroll.scrollTop;
    this._handleScroll(scrollTop);
  }
  goWindow = (path, item, isread, cardTo) => {
    // window.open(path)
    if (path) {
      ipcRenderer.send('visit-page', {
        url:
          path + (item.xtid === '109003' ? '' : JSON.parse(sessionStorage.getItem('user')).token),
        browser: 'chrome',
      });
    } else {
      if (isread) {
        this.setState({
          detailVisable: true,
          dbDetail: item,
        });
      } else {
        this.setState({
          connent: '',
          dbVisable: true,
          dbDetail: item,
          cardTo: cardTo,
        });
      }
    }
  };
  createXml = str => {
    if (document.all) {
      var xmlDom = new ActiveXObject('Microsoft.XMLDOM');
      xmlDom.loadXML(str);
      return xmlDom;
    } else return new DOMParser().parseFromString(str, 'text/xml');
  };
  //取消关注
  getCancelSave = id => {
    this.state.saveList.map((e, i) => {
      if (e.id === id) {
        this.state.saveList.splice(i, 1);
      }
    });
    this.setState({
      saveList: this.state.saveList,
    });
    this.props.dispatch({
      type: 'save/getCancelSave',
      payload: {
        nodeid: id,
        jid: this.props.xmppUser,
      },
      callback: response => {
        if (response.data) {
          message.success('提示:取消关注成功!');
          this.props.cancelSave(id);
        }
      },
    });
  };
  //关注
  getSave = (id, name, remark) => {
    this.state.saveList.push({ id: id });
    if (this.state.saveList.length > 0) {
      for (var i = 0; i < this.state.saveList.length - 1; i++) {
        for (var j = i + 1; j < this.state.saveList.length; j++) {
          if (this.state.saveList[i].id == this.state.saveList[j].id) {
            this.state.saveList.splice(j, 1);
            j--;
          }
        }
      }
    }
    this.setState({
      saveList: this.state.saveList,
    });
    this.props.dispatch({
      type: 'save/getSave',
      payload: {
        nodeid: id,
        jid: this.props.xmppUser,
        nodename: name,
        remark: remark,
      },
      callback: response => {
        if (response.data) {
          message.success('提示:关注成功!');
        }
      },
    });
  };
  getCommentList = list => {
    if (list.length > 0) {
      for (var i = 0; i < list.length - 1; i++) {
        for (var j = i + 1; j < list.length; j++) {
          if (list[i].xxmc.msg == list[j].xxmc.msg && list[i].time == list[j].time) {
            list.splice(j, 1);
            j--;
          }
        }
      }
    }
  };
  showDrawer = () => {
    this.setState({
      visible: true,
      dateLoading: true,
    });
    this.getTimeList();
  };
  getEmpty = () => {
    this.setState({
      xtValue: '',
      sxValue: null,
      timeDate: '',
      arrSearch: [],
      searchTime: [],
      searchResult: [],
      payloadSer: null,
    });
  };
  onClose = () => {
    this.setState({
      visible: false,
    });
  };
  onSearchList = () => {
    this.onClose();
    setTimeout(() => {
      let ser = [];
      this.state.arrSearch.map(item => {
        item.value.map(e => {
          ser.push(e);
        });
      });
      let payloads = {
        idcard: this.state.jobGl,
        size: this.state.isTable ? this.state.tableCount : this.state.pageCount,
        page: 0,
        timeStart: this.state.searchTime[0] ? this.state.searchTime[0] + ' 00:00:00' : '',
        timeEnd: this.state.searchTime[1] ? this.state.searchTime[1] + ' 23:59:59' : '',
        contain: this.state.searchValue,
        systemId: this.state.xtValue,
        messageStatus: ser,
      };
      this.setState({
        payloadSer: payloads,
      });
      this.getSocketList(true, null, payloads);
    }, 300);
  };
  changeTable = () => {
    this.props.dispatch({
      type: 'user/getTable',
      payload: {
        isTable: !this.state.isTable,
      },
    });
    this.setState({
      isTable: !this.state.isTable,
      loading: true,
    });
    setTimeout(() => {
      this.setState({
        loading: false,
        endLength: 0,
      });
      let payloads = {
        idcard: this.state.jobGl,
        size: this.state.isTable ? this.state.tableCount : this.state.pageCount,
        page: 0,
        timeStart: '',
        timeEnd: '',
        contain: this.state.searchValue,
        systemId: '',
        messageStatus: [],
      };
      if (this.state.payloadSer) {
        this.state.payloadSer.page = 0;
        this.state.payloadSer.size = this.state.isTable
          ? this.state.tableCount
          : this.state.pageCount;
        this.state.payloadSer.contain = this.props.user.value;
      }
      this.getSocketList(true, null, this.state.payloadSer ? this.state.payloadSer : payloads);
    }, 300);
  };
  onSxChange = checkedValues => {
    this.setState({
      sxValue: checkedValues.target.value,
      arrSearch: [],
      xzValue: [],
    });
  };
  onChange = checkedValues => {
    this.setState({
      xtValue: checkedValues.target.value,
      searchResult: null,
      checkedList: null,
      payloadSer: null,
      arrSearch: [],
    });
    this.props.dispatch({
      type: 'user/getConfigGoto',
      callback: response => {
        response.third.map((event, i) => {
          if (event.unique === checkedValues.target.value) {
            if (event.api !== '') {
              if (response.system.use_proxy) {
                window.configUrl.jz_search = `${window.configUrls.serve}/t${event.unique}`;
              } else {
                window.configUrl.jz_search = event.api;
              }
              if (checkedValues.target.value === '109003') {
                this.props.dispatch({
                  type: 'user/getSacwSerach',
                  payload: {},
                  callback: res => {
                    if (res.TermInfo) {
                      this.setState({ searchResult: res.TermInfo });
                    }
                  },
                });
              } else if (checkedValues.target.value === '109006') {
                this.props.dispatch({
                  type: 'user/getJzSerach',
                  payload: {},
                  callback: res => {
                    this.setState({ searchResult: res.result.TermInfo });
                  },
                });
              } else if (checkedValues.target.value === '109005') {
                this.props.dispatch({
                  type: 'user/getAgSerachs',
                  callback: res => {
                    if (res.data) {
                      this.setState({
                        searchResult: JSON.parse(res.data).TermInfo,
                        sxValue: null,
                      });
                    }
                  },
                });
              }
            }
          }
        });
      },
    });
  };
  onChangeChecks = (value, type) => {
    let arr = [];
    let t = true;
    let idx = 0;
    this.setState({
      xzValue: value,
    });
    if (this.state.arrSearch && this.state.arrSearch.length > 0) {
      this.state.arrSearch.map((item, index) => {
        if (item.type === type) {
          t = false;
          idx = index;
        }
      });
      if (!t) {
        this.state.arrSearch[idx] = { type: type, value: value };
      } else {
        this.state.arrSearch.push({ type: type, value: value });
      }
    } else {
      this.state.arrSearch.push({ type: type, value: value });
    }
    this.setState({
      arrSearch: this.state.arrSearch,
      lxValue: value,
    });
  };
  onChangeTime = (time, t) => {
    this.setState({
      timeDate: time,
      searchTime: t,
    });
  };
  getTimeList = () => {
    let payloads = {
      idcard: this.state.jobGl,
      size: 999,
      page: 0,
      timeStart: '',
      timeEnd: '',
      contain: '',
      systemId: '',
      messageStatus: [],
    };
    if (this.state.timeList.length === 0) {
      let timeList = [];
      this.props.dispatch({
        type: 'user/SocketQuery',
        payload: payloads,
        callback: res => {
          let key = this.props.msg_key_str
            ? this.props.msg_key_str.split(',').map(item => parseInt(item))
            : '';
          let response = JSON.parse(aes_decrypt(key, res.cipher));
          if (response.data && response.data.length > 0) {
            response.data.map(event => {
              timeList.push({ time: event.time });
            });
          }
          this.setState({
            dateLoading: false,
          });
        },
      });
      timeList = Array.from(new Set(timeList));
      this.setState({
        timeList
      })
    } else {
      this.setState({
        dateLoading: false,
      });
    }
  };
  getConnent = e => {
    this.setState({
      connent: e.target.value,
    });
  };
  goOldNews = () => {
    if (!this.state.goScrollBottom) {
      this.setState({
        numBoxAnimate: styles.fadeOutRight,
        goScrollBottom: true,
        changeIcon: true,
        endLength: 0,
      });
      this.getUnRead(0, true, this.props.unreadCount);
      this.props.getResetUnread();
    } else {
      this.setState({
        goScrollBottom: false,
        numBoxAnimate: styles.none,
      });
      this.changeList();
    }
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    let list = [];
    list = [];
    if (this.state.detailList.length > 0) {
      let k = -1;
      let data = this.state.detailList;
      data.map((items, index) => {
        this.state.saveList.map((e, i) => {
          if (e.id === '/' + items.xxbj.id) {
            k = 1;
          } else {
            k = -1;
          }
        });
        this.props.gzList.map((e, i) => {
          if (e.id === '/' + items.xxbj.id) {
            k = 1;
          }
        });
        list.push(
          <SmartDetailItem
            index={index}
            i={1}
            childItem={items}
            code={this.props.code}
            goWindow={(path, id, isread, cardTo) => this.goWindow(path, id, isread, cardTo)}
            k={k}
            getSave={(id, name, remark) => this.getSave(id, name, remark)}
            getCancelSave={id => this.getCancelSave(id)}
            agxt={this.state.agxt}
          />
        );
      });
    }
    const search = [];
    const searchs = [];
    if (this.state.searchResult) {
      this.state.searchResult.map(item => {
        searchs.push(item.Text);
      });
    }
    if (this.state.sxValue && this.state.searchResult) {
      this.state.searchResult.map(item => {
        let serList = [];
        item.Term.map(e => {
          serList.push(e.Text);
        });
        if (item.Text === this.state.sxValue) {
          search.push(
            <div>
              <div className={styles.titleTop}>
                <span>{item.Text}</span>
              </div>
              <div>
                <CheckboxGroup
                  value={this.state.xzValue}
                  options={serList}
                  onChange={e => this.onChangeChecks(e, item.Text)}
                  className={styles.checkedTag}
                />
              </div>
            </div>
          );
        }
      });
    }
    let btnName;
    this.state.dbDetail &&
      this.state.dbDetail.btn_ary &&
      this.state.dbDetail.btn_ary.map(btn => {
        if (btn.msg.indexOf('详情') > -1) {
          return false;
        } else {
          btnName = btn.msg;
        }
      });
    return (
      <div>
        <div className={styles.headerTitle}>
          <span style={{ float: 'left' }}>消息</span>
          <Tooltip placement="bottom" title="切换">
            <span
              style={{
                float: 'right',
                cursor: 'pointer',
                color: '#444',
                height: '36px',
              }}
            >
              {/*<Icon type="bars" theme="outlined" onClick={this.changeTable} />*/}
              <img src="images/listChange.png" onClick={this.changeTable} />
            </span>
          </Tooltip>
          <Tooltip placement="bottom" title="筛选">
            <span
              style={{
                float: 'right',
                cursor: 'pointer',
                color: '#444',
                height: '36px',
                marginRight: '10px',
              }}
            >
              {/*<Icon type="appstore" theme="outlined" onClick={this.showDrawer} />*/}
              <img src="images/search0.png" onClick={this.showDrawer} />
            </span>
          </Tooltip>
          <div>
            <Drawer
              title={
                <div>
                  <span>筛选</span>
                  <Icon
                    className={styles.floatR}
                    onClick={this.onClose}
                    style={{ fontSize: '18px', cursor: 'pointer', marginTop: '3px' }}
                    type="arrow-right"
                    theme="outlined"
                  />
                </div>
              }
              placement="right"
              closable={false}
              onClose={this.onClose}
              visible={this.state.visible}
              mask={false}
              width={310}
            >
              <div
                className={styles.titleBorderNone}
                style={{ padding: '0 16px', overflow: 'hidden' }}
              >
                <div
                  className={styles.floatR}
                  style={{
                    fontSize: '15px',
                    marginTop: '3px',
                    cursor: 'pointer',
                    color: '#1890ff',
                  }}
                  type="setting"
                  theme="outlined"
                  onClick={this.getEmpty}
                >
                  重置
                </div>
              </div>
              <div className={styles.boxTime} id="time">
                <Spin
                  style={{
                    zIndex: '9999',
                    height: '270px',
                    lineHeight: '270px',
                    background: 'transparent',
                  }}
                  spinning={this.state.dateLoading}
                >
                  <RangePicker
                    open={true}
                    getCalendarContainer={() => document.getElementById('time')}
                    onChange={this.onChangeTime}
                    value={this.state.timeDate}
                    dateRender={(current, today) => {
                      const style = {};
                      this.state.timeList.map(event => {
                        if (event.time.substring(0, 10) === moment(current).format('YYYY-MM-DD')) {
                          style.background = '#e0d394';
                        }
                      });
                      return (
                        <div className="ant-calendar-date" style={style}>
                          {current.date()}
                        </div>
                      );
                    }}
                  />
                </Spin>
              </div>
              <div className={styles.tagScroll} style={{ height: this.state.height - 290 + 'px' }}>
                <div>
                  <div className={styles.titleBorderNone} style={{ margin: '5px 0' }}>
                    <span>系统来源</span>
                    <Icon
                      className={styles.floatR}
                      style={{ fontSize: '15px', marginTop: '3px' }}
                      type="setting"
                      theme="outlined"
                    />
                  </div>
                  <div>
                    <RadioGroup
                      value={this.state.xtValue}
                      options={this.state.xtly}
                      onChange={this.onChange}
                      className={styles.checkedTag}
                    />
                  </div>
                </div>
                {this.state.searchResult && this.state.searchResult.length > 0 ? (
                  <div>
                    <div className={styles.titleTop}>
                      <span>查询事项</span>
                    </div>
                    <div>
                      <RadioGroup
                        value={this.state.sxValue}
                        options={searchs}
                        onChange={this.onSxChange}
                        className={styles.checkedTag}
                      />
                    </div>
                  </div>
                ) : (
                  ''
                )}
                {search && search.length > 0 ? search : ''}
              </div>
              <Button className={styles.btnTag} onClick={this.onSearchList} type="primary">
                确定
              </Button>
            </Drawer>
          </div>
        </div>
        {this.state.isTable ? (
          <TableDetail
            height={this.state.height}
            total={this.state.total}
            count={this.state.tableCount}
            data={this.state.detailList}
            loading={this.state.loading}
            searchValue={this.state.searchValue}
            idCard={this.state.jobGl}
            getSocketList={(empty, scrollHeight, payloads) =>
              this.getSocketList(empty, scrollHeight, payloads)
            }
            goWindow={(path, item, isread, cardTo) => this.goWindow(path, item, isread, cardTo)}
            payloadSer={this.state.payloadSer ? this.state.payloadSer : null}
          />
        ) : (
          <div
            className={styles.rightScroll}
            style={{ height: this.state.height + 'px' }}
            ref="scroll"
          >
            <div className={this.state.numBoxAnimate} onClick={this.goOldNews}>
              {this.state.changeIcon ? (
                <Icon type="down" className={styles.upIcon} />
              ) : (
                <div>
                  <div className={styles.leftNewsIcon}>
                    <Icon type="message" />
                  </div>
                  <div>
                    {this.props.unreadCount ? this.props.unreadCount : 0}条新消息<Icon
                      type="up"
                      className={styles.upIcon}
                    />
                  </div>
                </div>
              )}
            </div>
            <Spin
              className={
                this.state.load &&
                (this.props.code === '200003' ||
                  (this.props.code !== '200003' && this.props.type == 2))
                  ? ''
                  : styles.none
              }
              style={{ margin: '10px 0 0 50%', left: '-10px', position: 'absolute' }}
            />
            <Spin size="large" className={this.state.loading ? '' : styles.none} />
            <div
              className={
                this.state.lookMore && !this.state.loading && this.state.detailList.length > 0
                  ? ''
                  : styles.none
              }
              style={{
                width: '100%',
                textAlign: 'center',
                height: '40px',
                lineHeight: '50px',
                fontSize: '12px',
                color: '#1d94ee',
                position: 'relative',
              }}
            >
              {this.state.lookNews ? (
                <div className={styles.wordTextBox}>{this.state.lookNews}</div>
              ) : (
                '查看更多消息'
              )}
            </div>
            <div className={this.state.loading ? styles.none : ''}>
              {this.state.empty ? (
                <div
                  style={{ width: '100%', textAlign: 'center', height: '50px', lineHeight: '50px' }}
                >
                  暂无数据
                </div>
              ) : (
                list
              )}
            </div>
          </div>
        )}
        <Modal
          title={
            this.state.dbDetail && this.state.dbDetail.xxmc && this.state.dbDetail.xxmc.msg
              ? this.state.dbDetail.xxmc.msg
              : '操作'
          }
          visible={this.state.dbVisable}
          onOk={this.handleOk}
          okText={btnName ? btnName : null}
          onCancel={this.handleCancel}
          maskClosable={false}
          width={600}
        >
          <Row gutter={8}>
            {this.state.dbDetail &&
            this.state.dbDetail.xxxs_ary &&
            this.state.dbDetail.xxxs_ary.length > 0
              ? this.state.dbDetail.xxxs_ary.map(event => {
                  return (
                    <Col span={event.msg.length > 15 ? 24 : 8} style={{ margin: '5px 0' }}>
                      <div>{event.msg}</div>
                    </Col>
                  );
                })
              : ''}
          </Row>
          {/*<div className={styles.htmlBox} dangerouslySetInnerHTML={{ __html: this.state.form&&this.state.form['tid01']&&this.state.form['tid01'].html ? this.state.form['tid01'].html.replace('@@@', btnName&& btnName.length > 2 ? btnName.substring(btnName.length - 2, btnName.length)+'意见：':''):'' }} ></div>*/}
          <Row>
            <Col span={24} style={{ margin: '5px 0' }}>
              {btnName && btnName.length > 2
                ? btnName.substring(btnName.length - 2, btnName.length)
                : ''}意见：
            </Col>
            <Col span={24} style={{ margin: '5px 0' }}>
              <TextArea rows={4} value={this.state.connent} onChange={this.getConnent} />
            </Col>
          </Row>
        </Modal>
        <Modal
          title={
            this.state.dbDetail && this.state.dbDetail.xxmc && this.state.dbDetail.xxmc.msg
              ? this.state.dbDetail.xxmc.msg
              : '详情'
          }
          visible={this.state.detailVisable}
          footer={null}
          onCancel={this.handleCancel}
          maskClosable={false}
          width={600}
        >
          <Row gutter={8}>
            <Col span={24} style={{ margin: '5px 0' }}>
              <div>
                时间：{this.state.dbDetail && this.state.dbDetail.time
                  ? this.state.dbDetail.time
                  : ''}
              </div>
            </Col>
            <Col span={24} style={{ margin: '5px 0' }}>
              <div>
                业务状态：{this.state.dbDetail &&
                this.state.dbDetail.xxzt &&
                this.state.dbDetail.xxzt.msg
                  ? this.state.dbDetail.xxzt.msg
                  : ''}
              </div>
            </Col>
            {this.state.dbDetail &&
            this.state.dbDetail.xxxs_ary &&
            this.state.dbDetail.xxxs_ary.length > 0
              ? this.state.dbDetail.xxxs_ary.map(event => {
                  return (
                    <Col span={24} style={{ margin: '5px 0' }}>
                      <div>{event.msg}</div>
                    </Col>
                  );
                })
              : ''}
          </Row>
        </Modal>
      </div>
    );
  }
}
