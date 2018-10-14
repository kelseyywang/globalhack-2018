import React, { Component } from "react";
import firebase from "./firebase.js";
import "./App.css";
import "handsontable/dist/handsontable.full.css";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
// import 'handsontable-pro/dist/handsontable.full.css';
// import { HotTable } from '@handsontable-pro/react';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showProviderList: false,
      currentProviderList: "childcare-providers",
      dataFromFirebase: [],
      dataFieldsFromFirebase: [],
      itemNames: [],
      selectedColumn: 0
    };
  }

  setProvider(providerList) {
    console.log("setting to provider list: " + providerList);
    this.setState({
      showProviderList: true,
      currentProviderList: providerList
    });
    this.pullFromFirebase(providerList);
  }

  setColumn(col)
  {
    this.setState({
      selectedColumn: col
    });
  }

  pullFromFirebase(providerList)
  {
    this.setState({
      dataFromFirebase: [],
      dataFieldsFromFirebase: [],
      itemNames: []
    });
    const infoRef = firebase.database().ref("web-app").child("provider-lists").child(providerList);
    infoRef.once('value', (snapshot) => {
      let items = snapshot.val();
      let newData = [];
      let dataFields = [];
      let itemNamesTemp = [];
      for (let item in items) {
        itemNamesTemp.push(item);

        if (item === "TRACKED-DATA")
        {
          dataFields = items[item];
          var dataHeaders = [];
          for(let field in dataFields)
          {
            dataHeaders.push(dataFields[field]);
          }
          dataFields = dataHeaders;
          newData.push(dataHeaders);
        }
        else if (item !== "TRACKED-DATA" && item !== "DATA-TO-QUESTIONS")
        {
          var newItem = {
            id: item
          };
          for (let field in dataFields)
          {
            console.log(field);
            console.log(dataFields[field]);
            if (items[item][dataFields[field]])
            {
              newItem[dataFields[field]] = items[item][dataFields[field]];
            }

          }
          console.log(newItem);
          newData.push(newItem);
        }
      }
      this.setState({
        dataFromFirebase: newData,
        itemNames: itemNamesTemp,
        dataFieldsFromFirebase: dataFields,
      });
      console.log(this.state);
    });
  }

  addNewEntry()
  {
    console.log("NEW ENTRY" + this.state.currentProviderList);
    var newData = this.state.itemNames.slice();
    const infoRef = firebase.database().ref("web-app").child("provider-lists").child(this.state.currentProviderList);
    var newItemName = infoRef.push().key;
    var newRef = infoRef.child(newItemName);
    newRef.update({
      "ADDRESS": "LOL"
    });


    newData.push(newItemName);
    this.setState({
      itemNames: newData
    });
  }

  showDashboard() {
    this.setState({
      showProviderList: false
    });
  }

  renderProviderManager(providerListName)
  {
      console.log("showing provider list");
      return (
        <ProviderManager
          reloadFromFirebase={'true'}
          dataFieldsFromFirebase={this.state.dataFieldsFromFirebase}
          dataFromFirebase={this.state.dataFromFirebase}
          dataItemNames={this.state.itemNames}
          addNewEntry={() => this.addNewEntry()}
          providerList={providerListName} goBack={() => this.showDashboard()} />
      );
  }

  renderDashboardManager() {
    return (
      <DashboardView
        onSetProvider={providerList => this.setProvider(providerList)}
      />
    );
  }

  renderQuestionPreview()
  {
      return(
            <QuestionPreview />
      );
  }

  render()
  {
    const style = this.state.showProviderList ? {} : {display: 'none'};
    return (
      <div className="App">
        <div className="App-header">
          <h3> SLaftey Net </h3>
        </div>
        <div className="MainContent">
          <div className="Dashboard-Container">
            {this.renderDashboardManager()}
          </div>
          <div style={style}>
            {this.renderProviderManager(this.state.currentProviderList)}
          </div>
          <div className="QuestionPreview" style={style}>
            {this.renderQuestionPreview()}
          </div>
        </div>
      </div>
    );
  }
}

class QuestionPreview extends Component
{
  render()
  {
    return (
      <div>
        <h2> Question preview </h2>
      </div>
    );
  }
}

class DashboardView extends Component
{
  render()
  {
    return (
      <div className="DashboardView">
        <div className="Dashboard-content">
          <h3> Provider Info </h3>
             <button className="ProviderSelect" onClick={() => this.props.onSetProvider("healthcare-providers")}> Healthcare </button>
             <button className="ProviderSelect" onClick={() => this.props.onSetProvider("childcare-providers")}> Child Care </button>
             <button className="ProviderSelect"> Legal Services </button>
             <button className="ProviderSelect"> Employment Services </button>
        </div>
      </div>
    );
  }
}

class ProviderManager extends Component {
  constructor(props) {
    super(props);
  }

  changeProvider(newProviderList) {
    this.setState({
      providerList: newProviderList
    });
  }

  render() {
    return (
      <div className="ProviderManager">
        <h2> Provider Information </h2>
        <TableManager
          providerList={this.props.providerList}
          dataFieldsFromFirebase={this.props.dataFieldsFromFirebase}
          dataFromFirebase={this.props.dataFromFirebase}
          dataItemNames={this.props.dataItemNames}
          addNewEntry={() => this.props.addNewEntry()}
          reloadFromFirebase={this.props.reloadFromFirebase} />
      </div>
    );
  }
}

class TableManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      providerList: this.props.providerList,
      hotData: [],
      dataFields: this.props.dataFieldsFromFirebase,
      itemNames: [],
      reloadFromFirebase: this.props.reloadFromFirebase
    };
    this.hotSettings = {
      rowHeaders: false,
      fixedRowsTop: 1,
      cells: function (row, col) {
        var cellProp = {};
        if (row === 0){
          cellProp.classname = 'headerformat'
        }
        return cellProp
      },
    }
    this.hotTableComponent = React.createRef();
    // add hook for handsontable afterChange hook https://docs.handsontable.com/pro/6.0.1/Hooks.html#event:afterChange
    // use firebase update https://firebase.google.com/docs/database/web/read-and-write
    // adding a new column should add a new field in TRACKED-DATA
  }

  componentDidMount() {
    console.log(this.props);
    this.loadDataToTable();
    Handsontable.hooks.add('afterChange', (change, source)=>this.updateFirebase(change, source));
    // this.hotTableComponent.current.hotInstance.addHook('afterChange', this.updateFirebase);
  }

  updateFirebase(changes, source)
  {
    console.log(changes);
    if (source === 'loadData') {
        return; //don't save this change
    }
    console.log(this);
    if (this.props != null){
      for (let i = 0; i < changes.length; i++)
      {
        console.log("UPDATE FIREBASE: " + changes[i][0] + " " + this.props.providerList);
        const infoRef = firebase.database().ref("web-app").child("provider-lists").child(this.props.providerList);
        var data = this.hotTableComponent.current.hotInstance.getData();
        console.log("UPDATING: " + this.props.dataItemNames[changes[i][0]]);
        if (changes[i][0] == 0){
          // IF YOU EDITED A COLUMN HEADER
          infoRef.child(this.props.dataItemNames[changes[i][0]]).update({
            [this.props.dataFieldsFromFirebase[changes[i][1]]]: changes[i][3]
          });
          infoRef.child(this.props.dataItemNames[changes[i][0]]).update({
            [changes[i][2]]: null
          });
        }
        else {
          infoRef.child(this.props.dataItemNames[changes[i][0]]).update({
            [this.props.dataFieldsFromFirebase[changes[i][1]]]: changes[i][3]
          });
        }

      }
    }
  }

  loadDataToTable()
  {
    console.log("LOAD DATA TO TABLE: " + this.props.dataFromFirebase);
    var newData = [];
    console.log(newData);
    var colHeaders = this.props.dataFromFirebase[0];
    console.log(colHeaders);
    for (let i = 0; i < this.props.dataFromFirebase.length; i++)
    {
      if (i === 0) {
        newData.push(this.props.dataFromFirebase[i]);
      }
      else {
        var newItem = [];
        for (let field in colHeaders)
        {
          newItem[field] = this.props.dataFromFirebase[i][colHeaders[field]];
        }
        newData.push(newItem);
      }
    }
    this.hotTableComponent.current.hotInstance.loadData(newData);
  }

  handleAddClick(type)
  {
    if (type === "COLUMN") {
      // var newColumnHeaders = this.hotTableComponent.current.hotInstance.getColHeader();
      // newColumnHeaders.push("NEW COL HEADER");
      // console.log(newColumnHeaders);
      // this.hotTableComponent.current.hotInstance.updateSettings({
      //   colHeaders: newColumnHeaders
      // });
      // this.hotSettings.colHeaders = newColumnHeaders;
      this.hotTableComponent.current.hotInstance.alter('insert_col', this.props.dataFromFirebase[0].length);
      this.hotTableComponent.current.hotInstance.setDataAtCell(0, this.hotTableComponent.current.hotInstance.getData()[0].length - 1, "NEW COL");
      // this.props.dataFromFirebase[0][this.props.dataFromFirebase[0].length - 1] = "NEW COL"; // TODO: fix state mutation
    }
    else if (type === "ROW") {
      this.hotTableComponent.current.hotInstance.alter('insert_row', 1);
    }

    this.hotTableComponent.current.hotInstance.render();
    console.log(this.hotTableComponent.current.hotInstance.getData());
  }

  render() {
    console.log("RELOAD " + this.state.reloadFromFirebase + this.state.providerList);
    if (this.hotTableComponent.current != null)
    {
      this.loadDataToTable();
    }
    // if (this.state.reloadFromFirebase)
    // {
    //   console.log("RELOAD");
    //   this.setState({
    //     reloadFromFirebase: false
    //   });
    //   // this.pullFromFirebase();
    // }
    return (
      <div className="TableManager">
        <div className="ToolBar">
          <div className="LeftDock">
            <button onClick={() => this.handleAddClick("COLUMN")}>
              ADD NEW DATA FIELD
            </button>
          </div>
          <div className="RightDock">
            <button onClick={() => this.props.addNewEntry()}>
              ADD NEW ENTRY
            </button>
          </div>
        </div>
        <div id="hot-app">
          <HotTable ref={this.hotTableComponent} settings={this.hotSettings} />
        </div>
      </div>
    );
  }
}

class TextBox extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return <input type="text" />;
  }
}

export default App;
