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
      selectedColumn: 0,
      selectedField: "",
      questionPreviewText: ""
    };
    this.addNewEntry = this.addNewEntry.bind(this);
    this.setColumn = this.setColumn.bind(this);
    this.updateQuestionText = this.updateQuestionText.bind(this);
    this.updateFirebase = this.updateFirebase.bind(this);
    this.showFlowEditor = this.showFlowEditor.bind(this);
  }

  setProvider(providerList) {
    this.setState({
      showProviderList: true,
      currentProviderList: providerList
    });
    this.pullFromFirebase(providerList);
  }

  updateQuestionText(newValue)
  {
    const infoRef = firebase.database().ref("web-app").child("provider-lists").child(this.state.currentProviderList).child("DATA-TO-QUESTIONS");
    infoRef.update({
      [this.state.selectedField]: newValue
    });
    this.setState({
      questionPreviewText: newValue
    });
  }

  setColumn(col)
  {
    var colHeaders = this.state.dataFromFirebase[this.state.itemNames.indexOf("TRACKED-DATA")];
    if (colHeaders)
    {
      var lookUpField = colHeaders[col];
      var questionText = "";
      const infoRef = firebase.database().ref("web-app").child("provider-lists").child(this.state.currentProviderList).child("DATA-TO-QUESTIONS");
      infoRef.once('value', (snapshot) => {
        let items = snapshot.val();
        questionText = items[lookUpField];
        this.setState({
          selectedColumn: col,
          questionPreviewText: questionText,
          selectedField: lookUpField
        });
      });
    }
  }

  updateFirebase()
  {
    this.pullFromFirebase(this.state.currentProviderList);
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

      dataFields = items["TRACKED-DATA"];
      var dataHeaders = [];
      for(let field in dataFields)
      {
        dataHeaders.push(dataFields[field]);
      }
      dataFields = dataHeaders;
      newData.push(dataHeaders);
      itemNamesTemp.push("TRACKED-DATA");

      for (let item in items) {
        if (item !== "TRACKED-DATA" && item !== "DATA-TO-QUESTIONS" && item !== "FILTER1")
        {
          itemNamesTemp.push(item);
          var newItem = {
            id: item
          };
          for (let field in dataFields)
          {
            if (items[item][dataFields[field]])
            {
              newItem[dataFields[field]] = items[item][dataFields[field]];
            }

          }
          newData.push(newItem);
        }
      }
      this.setState({
        dataFromFirebase: newData,
        itemNames: itemNamesTemp,
        dataFieldsFromFirebase: dataFields,
      });
    });
  }

  addNewEntry()
  {
    var newData = this.state.itemNames.slice();
    const infoRef = firebase.database().ref("web-app").child("provider-lists").child(this.state.currentProviderList);
    var newItemName = infoRef.push().key;
    var newRef = infoRef.child(newItemName);

    var newItem = {};
    var colHeaders = this.state.dataFromFirebase[this.state.itemNames.indexOf("TRACKED-DATA")];
    for (let field in colHeaders)
    {
      newItem[colHeaders[field]] = " ";
    }
    newRef.update(newItem);

    newData.push(newItemName);
    this.setState({
      itemNames: newData
    });
    this.pullFromFirebase(this.state.currentProviderList);
  }

  showDashboard() {
    this.setState({
      showProviderList: false
    });
  }

  renderProviderManager(providerListName)
  {
      return (
        <ProviderManager
          reloadFromFirebase={'true'}
          dataFieldsFromFirebase={this.state.dataFieldsFromFirebase}
          dataFromFirebase={this.state.dataFromFirebase}
          dataItemNames={this.state.itemNames}
          addNewEntry={this.addNewEntry}
          setColumn={this.setColumn}
          updateFirebase={this.updateFirebase}
          providerList={providerListName} goBack={() => this.showDashboard()} />
      );
  }

  renderDashboardManager() {
    return (
      <DashboardView
        onSetProvider={providerList => this.setProvider(providerList)}
        showFlowEditor={this.showFlowEditor}
      />
    );
  }

  renderQuestionPreview()
  {
      return(
            <QuestionPreview
              updateQuestionText={this.updateQuestionText}
              questionText={this.state.questionPreviewText}
              selectedField={this.state.selectedField} />
      );
  }

  showFlowEditor()
  {

  }

  render()
  {
    const style = this.state.showProviderList ? {} : {display: 'none'};
    return (
      <div className="App">
        <div className="App-header">
          <h3> Samaritan </h3>
          <img className="logo" src="samaritan.png" />
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
  constructor(props)
  {
    super(props);
    this.state = {
      questionText: props.questionText
    };
  }

  handleChange(e)
  {
    this.setState({questionText: e.target.value});
  }

  updateQuestionText()
  {
    this.props.updateQuestionText(this.state.questionText);
  }

  render()
  {
    return (
      <div>
        <h2> Question preview </h2>
        <p> Your current selected field is: </p>
        <p className="questionText"> {this.props.selectedField} </p>
        <br/>
        <p> To help your users filter for useful results, Samaritan will ask: </p>
        <p className="questionText"> {this.props.questionText} </p>
        <p> If you would like to change this question, type a new question in the box below </p>
        <textarea className="textAreaInput" type='text' value={this.state.questionText} onChange={(event) => this.handleChange(event)} />
        <button className="TableButton" onClick={() => this.updateQuestionText()}> Update question </button>
        <br/>
        <button className="TableButton"> See question tree flow </button>
      </div>
    );
  }
}

class FlowView extends Component
{
  render()
  {
    return (
      <div className="FlowView">

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
          <h3> Select Provider Category </h3>
             <button className="ProviderSelect" onClick={() => this.props.onSetProvider("healthcare-providers")}> Healthcare </button>
             <button className="ProviderSelect" onClick={() => this.props.onSetProvider("childcare-providers")}> Child Care </button>
             <button className="ProviderSelect" onClick={() => this.props.onSetProvider("legal-providers")}> Legal Services </button>
             <button className="ProviderSelect" onClick={() => this.props.onSetProvider("employment-providers")}> Employment Services </button>
           <h3> Manage Chat Flow </h3>
              <button className="ProviderSelect" onClick={() => this.props.showFlowEditor()}> Edit Flow </button>
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
          addNewEntry={this.props.addNewEntry}
          setColumn={this.props.setColumn}
          updateFirebase={this.props.updateFirebase}
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
      width: 800,
      height: 500,
      stretchH: true,
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

  updateSelectedRow(event, coords, TD)
  {
    this.props.setColumn(coords["col"]);
  }

  componentDidMount() {
    this.loadDataToTable();
    Handsontable.hooks.add('afterChange', (change, source)=>this.updateFirebase(change, source));
    Handsontable.hooks.add('afterOnCellMouseDown', (event, coords, TD)=>this.updateSelectedRow(event, coords, TD));
    // this.hotTableComponent.current.hotInstance.addHook('afterChange', this.updateFirebase);
  }

  updateFirebase(changes, source)
  {
    if (source === 'loadData') {
        return; //don't save this change
    }
    if (this.props != null){
      for (let i = 0; i < changes.length; i++)
      {
        const infoRef = firebase.database().ref("web-app").child("provider-lists").child(this.props.providerList);
        var data = this.hotTableComponent.current.hotInstance.getData();
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
      this.props.updateFirebase();
    }
  }

  loadDataToTable()
  {
    var newData = [];
    var colHeaders = this.props.dataFromFirebase[this.props.dataItemNames.indexOf("TRACKED-DATA")];
    for (let i = 0; i < this.props.dataFromFirebase.length; i++)
    {
      if (i === this.props.dataItemNames.indexOf("TRACKED-DATA")) {
        newData.unshift(this.props.dataFromFirebase[i]);
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
      this.hotTableComponent.current.hotInstance.alter('insert_col', this.props.dataFromFirebase[0].length);
      this.hotTableComponent.current.hotInstance.setDataAtCell(0, this.hotTableComponent.current.hotInstance.getData()[0].length - 1, "NEW COL");
    }
    else if (type === "ROW") {
      this.hotTableComponent.current.hotInstance.alter('insert_row', 1);
      // also add a new entry
      this.props.addNewEntry();
    }

    this.hotTableComponent.current.hotInstance.render();
  }

  render() {
    if (this.hotTableComponent.current != null)
    {
      this.loadDataToTable();
    }
    return (
      <div className="TableManager">
        <div className="ToolBar">
          <div className="LeftDock">
          <button className="TableButton" onClick={() => this.handleAddClick("ROW")}>
            ADD NEW ENTRY
          </button>
          </div>
          <div className="RightDock">
          <button className="TableButton" onClick={() => this.handleAddClick("COLUMN")}>
            ADD NEW DATA FIELD
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
