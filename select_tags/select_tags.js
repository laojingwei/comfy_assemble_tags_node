import { app } from "/scripts/app.js";
import { ComfyWidgets } from "/scripts/widgets.js";
import "./xlsx.js"
app.registerExtension({
	name: "xww.SelectTags",
	async beforeRegisterNodeDef(nodeType, nodeData, app) {
		if (nodeData.name === "Show Seed") {
			const onNodeCreated = nodeType.prototype.onNodeCreated;
			nodeType.prototype.onNodeCreated = function () {
				const r = onNodeCreated?.apply(this, arguments);
				const w = ComfyWidgets["STRING"](this, "text", ["STRING", { multiline: true }], app).widget;

				return r;
			};
			const onExecuted = nodeType.prototype.onExecuted;
			nodeType.prototype.onExecuted = function (message) {
				onExecuted?.apply(this, arguments);

				this.widgets[0].value = message.seed;

				if (this.size[1] < 180) {
					this.setSize([this.size[0], 180]);
				}
			};
		}
		if (nodeData.name === "Show Tags") {
			const onNodeCreated = nodeType.prototype.onNodeCreated;
			nodeType.prototype.onNodeCreated = function () {
				const r = onNodeCreated?.apply(this, arguments);

				const w = ComfyWidgets["STRING"](this, "text", ["STRING", { multiline: true }], app).widget;

				return r;
			};
			const onExecuted = nodeType.prototype.onExecuted;
			nodeType.prototype.onExecuted = function (message) {
				onExecuted?.apply(this, arguments);

				this.widgets[0].value = message.text;

				if (this.size[1] < 180) {
					this.setSize([this.size[0], 180]);
				}
			};
		}
		let XLSXDATA = {}
		if (nodeData.name === "Select Tags") {
			const onNodeCreated = nodeType.prototype.onNodeCreated;
			nodeType.prototype.onNodeCreated = function () {
				// 要吐血了，为了Date.now这个数值，卡了我好久，平时测试很正常，一重启或导入工程就有问题；原来加载时Date.now的时间是一模一样的，这里加了个随机数终于好了，干！
				// I want to vomit blood, in order to Date.now the value, stuck me for a long time, usually the test is normal, once restart or import the project will have problems; The original loading Date.now time is exactly the same, here add a random number finally good, dry!
				this.timeInMs = `${Date.now()}${Math.random()}`;
				const r = onNodeCreated?.apply(this, arguments);
				let _this = this;
				_this.SELECTDATA = {};
				_this.showingID = "";
				this.widgets[0].inputEl.readOnly = true;
				this.widgets[0].inputEl.style.opacity = 0.6;
				this.addWidget("button", "selecttags", "selecttags", () => {
					let tcno = document.querySelectorAll("div.xww-tags-container");
					for (let tag of tcno) {
						tag.parentNode.removeChild(tag);
					}
					const container = document.createElement("div");
					container.classList.add("xww-tags-container");
					Object.assign(container.style, {
						display: "grid",
						gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
						gap: "10px",
						Width: "100%",
						
					});
					if (!XLSXDATA || Object.keys(XLSXDATA).length < 1) {
						// 我不想每次都请求这个，但是为了正确地获得这个文件的最新内容，我必须禁用浏览器缓存，要不然去修改了这个表后由于浏览器缓存，无法刷新最新数据出来
						// I don't want to request this every time, but in order to get the latest contents of this file correctly I have to disable the browser cache
						fetch('http://127.0.0.1:8188/extensions/select_tags/tags.xlsx', {
							cache: 'reload'
						  })
						.then(response => response.arrayBuffer())
						.then(buffer => {
								const xlsx = XLSX.read(new Uint8Array(buffer, {type: 'array'}));
								XLSXDATA = xlsx;
								processingXlsx(container);
								
							})
							.catch(err =>{
								XLSXDATA = {}
								console.error(err)
							});

					} else {
						processingXlsx(container);
					}
				});

				function processingXlsx(container) {
					_this.SEARChALLDATA = {};
					let sheetNames = XLSXDATA.SheetNames;
					for (let i = 0; i < sheetNames.length; i++) {
						const tags = document.createElement("button");
						tags.classList.add("xww-selecttags-tags-sheets");
						Object.assign(tags.style, {
							fontSize: "12px",
							color: "blue",
							width: "auto",
							width: "100%",
							wordWrap: "break-word",
							wordBreak: "break-all",
							textAlign: "center",
							display: "grid",
							background: "#99CCFF",
							alignItems:"center",
							
						});
						let saaKey = sheetNames[i];
						let sKey = "";
						let sVal = "";
						let sheetss = XLSXDATA.Sheets[sheetNames[i]];
						let sheets = sort(sheetss)
						let lastKey = Object.keys(sheets)[Object.keys(sheets).length - 1]
						for (let key in sort(sheets)) {
							try {
								if (sheets.hasOwnProperty(key) && key !== "!margins" && key !== "!ref") {
									let value = sheets[key].v;
									if (value.indexOf("**xww") !== -1 ){
										if (sVal) {
											_this.SEARChALLDATA[saaKey] = sVal;
											sVal = "";
										}
										value = value.replace("**xww","").replace("##xww","").replace("&&xww","");
										if(sKey) {
											saaKey = `${sheetNames[i]}->${value}`;
										} else {
											sKey = "1";
											saaKey = `${saaKey}->${value}`;
										}
									}
									sVal = `${sVal}¿${value}`;
									if (lastKey == key) {
										_this.SEARChALLDATA[saaKey] = sVal;
									}
								}
							} catch (error) {
								continue;
							}
						}
						tags.textContent = sheetNames[i];
						tags.onclick = (event) => {
							let sheetbtn = document.querySelectorAll("button.xww-selecttags-tags-sheets");
							for (let j = 0; j < sheetbtn.length; j++) {
								let tag = sheetbtn[j];
								tag.style.color = "blue";
								tag.style.background = "#99CCFF";
							}
							if (event.target.style.color == "blue") {
								event.target.style.color = "#00ff00";
								event.target.style.background = "#003371";
							} else {
								event.target.style.color = "blue";
								event.target.style.background = "#99CCFF";
							}
							showSelectTags(sheets,i+''+_this.timeInMs,sheetNames[i]);
						};
						container.append(tags);
					}
					dialog.show("");
					dialog.textElement.append(container);

					function sort(sheets) {
						let keys = Object.keys(sheets).sort(
							function(a, b) {
								return a.localeCompare(b, undefined, {numeric: true});
							  }
						);
						let sortedSheets = keys.reduce((obj, key) => {
							obj[key] = sheets[key];
							return obj;
						}, {});
						return sortedSheets
					}

					function showSelectTags(sheets,position,shelctPath) {
						let showtags = document.querySelectorAll("button.xww-selecttags-tags-show-tags-button-t, button.xww-selecttags-tags-show-tags-button, div.xww-selecttags-tags-show-tags-input");
						for (let tag of showtags) {
							tag.parentNode.removeChild(tag);
						}
						let selectTagsData = {};
						let keyStr = 'other/其它';
						let isPushOtr = true;
						let firstBtnId = '';
						for (let key in sheets) {
							try {
								if (sheets.hasOwnProperty(key) && key !== "!margins" && key !== "!ref") {
									let value = sheets[key].v;
									if (value.indexOf("**xww") !== -1 ){
										isPushOtr = false;
										let v = value.replace("**xww","");
										let id = key+'-btn-'+position;
										
										if (firstBtnId == '') {
											firstBtnId = id;
										}
										selectTagsData[id] = [];
										keyStr = id;
										const button = document.createElement("button");
										button.classList.add("xww-selecttags-tags-show-tags-button-t");
										Object.assign(button, {id:id});
										Object.assign(button.style, {
											fontSize: "20px",
											color: 'white',
											width: "100%",
											wordWrap: "break-word",
											wordBreak: "break-all",
											textAlign: "center",
											display: "grid",
											background: "#5761d5",
											alignItems:"center",
											
										});
										button.textContent = v;
										button.onclick = (event) => {
											let btn = document.querySelectorAll("button.xww-selecttags-tags-show-tags-button-t");
											for (let j = 0; j < btn.length; j++) {
												let tag = btn[j];
												tag.style.color = "white";
												tag.style.background = "#5761d5";
											}
											if (event.target.style.color == "white") {
												event.target.style.color = "#00ff00";
												event.target.style.background = "#0013f1";
											} else {
												event.target.style.color = "white";
												event.target.style.background = "#5761d5";
											}
											let len = 0;
											let key;
											for (key in selectTagsData) {
												if (selectTagsData.hasOwnProperty(key)) {
													len++;
												}
											}
											showKeyTags(selectTagsData[event.target.id],event.target.id,event.target.innerText,len,`${shelctPath}->${v}`);
										};
										container.before(button);
										container.append(button);
									} else if (isPushOtr) {
										isPushOtr = false;
										let v = 'other/其它';
										let id = key+'-btn-'+position;
										
										if (firstBtnId == '') {
											firstBtnId = id;
										}

										selectTagsData[id] = [];
										keyStr = id;
										const button = document.createElement("button");
										button.classList.add("xww-selecttags-tags-show-tags-button-t");
										Object.assign(button, {id:id});
										Object.assign(button.style, {
											fontSize: "20px",
											color: 'white',
											width: "100%",
											wordWrap: "break-word",
											wordBreak: "break-all",
											overflowWrap: "break-word",
											textAlign: "center",
											display: "grid",
											background: "#0013f1",
											alignItems:"center",
											
										});
										button.textContent = v;
										button.onclick = (event) => {
											let len = 0;
											let key;
											for (key in selectTagsData) {
												if (selectTagsData.hasOwnProperty(key)) {
													len++;
												}
											}
											showKeyTags(selectTagsData[event.target.id],event.target.id,event.target.innerText,len,`${shelctPath}->${v}`);
										};
										container.before(button);
										container.append(button);
									} else {
										selectTagsData[keyStr].push(value);
									}
								}
							} catch (error) {
								continue;
							}
						}
						if (firstBtnId) {
							let firstBtnIdDoc = document.getElementById(firstBtnId);
							firstBtnIdDoc.click();
						}
					}
					
					function showKeyTags(std,id,innerText,len,shelctPath) {
						_this.searchData = {};
						_this.showingID = id;
						var  length_ = 0;
						let showtags = document.querySelectorAll("button.xww-selecttags-tags-show-tags-button, div.xww-selecttags-tags-show-tags-input");
						for (let tag of showtags) {
							tag.parentNode.removeChild(tag);
						}
						
						const bton = document.createElement("button");
						bton.classList.add("xww-selecttags-tags-show-tags-button");
						Object.assign(bton.style, {
							fontSize: "18px",
							color: "red",
							width: "100%",
							// height: "30px",
							wordWrap: "break-word",
							wordBreak: "break-all",
							textAlign: "center",
							display: "grid",
							alignItems:"center",
							background: "#a6a9c9",
							
						});
						bton.textContent = "↓";
						len = 20 - len%10;
						let firstClone = bton.cloneNode(true);
						Object.assign(firstClone.style, {
							maxWidth: "100%",
							// height: "auto"
						});
						firstClone.textContent = innerText;
						container.after(firstClone);
						container.append(firstClone)
						for (let i = 0; i < len-1; i++) {
							container.after(bton.cloneNode(true));
						}
						for (let i = 0; i < len-1; i++) {
							container.append(bton.cloneNode(true));
						}

						for (let key = 0; key < std.length; key++) {
							try {
								let value = std[key];
								let color = "white";
								let background = "#222222";
								
								let btn = id+key+'-btn-';
								let iptl = id+key+'-iptl-';
								let ipt = id+key+'-ipt-';

								
								if (std && std.length>0){
									let v = value.replace("##xww","").replace("**xww","").replace("&&xww","");
									_this.searchData[v] = iptl;
								}
								
								let rep = String(_this.timeInMs);
								let regex = new RegExp(rep, 'g');
								let btId = btn.replace(regex,"-rep-");
								let iptColor = "white";
								let iptV = "0";
								if (_this.SELECTDATA && _this.SELECTDATA[btId]) {
									color = "green";
									background = "#CCFF99";
									iptV = _this.SELECTDATA[btId].input || 0;
									iptColor = Number(iptV)>0?"red":"white";
								}
								
								if (value.indexOf("##xww") !== -1 ){
									const button = document.createElement("button");
									button.classList.add("xww-selecttags-tags-show-tags-button");
									Object.assign(button, {id:btn});
									Object.assign(button.style, {
										fontSize: "20px",
										color: 'white',
										width: "100%",
										wordWrap: "break-word",
										wordBreak: "break-all",
										textAlign: "center",
										display: "grid",
										background: "#0013f1",
										alignItems:"center",
										
									});
									
									const button_ = document.createElement("button");
									button_.classList.add("xww-selecttags-tags-show-tags-button");
									Object.assign(button_, {name:id+key+'-btn_-'});
									// input.setAttribute("disabled", "");
									Object.assign(button_.style, {
										fontSize: "18px",
										color: "red",
										width: "100%",
										textAlign: "center",
										display: "grid",
										alignItems:"center",
										background: "#353535",
										
									});
									button_.textContent = "✄";
									button.textContent = value.replace("##xww","").replace("&&xww","");
									let space = length_%10;
									if (space > 1) {
										for (let i = 0; i < 10 - space; i++) {
											container.before(button_.cloneNode(true));
										}
										for (let i = 0; i < 10 - space; i++) {
											container.append(button_.cloneNode(true));
										}
									}
									container.before(button);
									container.append(button);
									for (let i = 0; i < 9; i++) {
										container.before(button_.cloneNode(true));
									}
									for (let i = 0; i < 9; i++) {
										container.append(button_.cloneNode(true));
									}
									// 1 + 9 + 20 - space
									length_ = length_ + 30 - space;
								} else {
									length_ = length_ + 2;
									const button = document.createElement("button");
									const iptdiv = document.createElement("div");
									const iptlabel = document.createElement("label");
									const input = document.createElement("input");
									button.classList.add("xww-selecttags-tags-show-tags-button");
									iptdiv.classList.add("xww-selecttags-tags-show-tags-input");
									Object.assign(button, {id:btn});
									Object.assign(button.style, {
										fontSize: "12px",
										color: color,
										width: "100%",
										wordWrap: "break-word",
										wordBreak: "break-all",
										textAlign: "center",
										display: "grid",
										background: background,
										alignItems:"center",
										
									});
									Object.assign(input, {type: "text", value:iptV, id:ipt, onkeyup: function(event) {
										this.value=this.value.match(/\d+\.?\d{0,4}/,'');
										if (Number(this.value)>0) {
											this.style.color = "red";
										} else {
											this.style.color = "white";
											this.value = 0;
										}
										if (std[key].indexOf("&&xww") !== -1) {
											return;
										}
										select_tags(event,'ipt',this.value);
									}});
									
									let style = document.createElement("style");
									style.setAttribute("type", "text/css");
									style.innerHTML = "@keyframes label-animation { 0% { transform: translateX(0); }  100% { transform: translateX(-10px); } }";
									// iptlabel.setAttribute("style", "animation: label-animation 1s infinite;");
									Object.assign(iptlabel, {id:iptl});
									Object.assign(iptdiv.style, {
										fontSize: "20px",
										color: iptColor,
										width: "100%",
										// 当我使用borderRadius=大于0数值时，页面会出现某些按钮很模糊的问题，这。。。太惨了，所以我只能把input的wdth调整为100%，再使用scale，最后添加margin-left。。。
										// When I use borderRadius= values greater than 0, the page is having issues with some blurred buttons, which... Too bad, so I had to change the input wdth to 100%, use scale, and finally add margin-left...
										transform: "scale(0.8)",
										marginLeft: "-10px",
										textAlign: "center",
										display: "grid",
										alignItems:"center",
										
									});
									Object.assign(iptlabel.style, {
										fontSize: "24px",
										color: "#00FF00",
										width: "100%",
										textAlign: "center",
										display: "none",
										alignItems:"center",
										
									});
									Object.assign(input.style, {
										fontSize: "20px",
										color: iptColor,
										width: "100%",
										textAlign: "center",
										display: "grid",
										alignItems:"center",
										background: "#4b4c4b",
										
									});
									
									button.onclick = (event) => {
										if (std[key].indexOf("&&xww") !== -1) {
											return;
										}
										select_tags(event,'','',shelctPath);
									};
									button.textContent = value.replace("&&xww","");
									iptlabel.textContent = "←☜";
									document.head.appendChild(style);
									iptdiv.append(iptlabel);
									iptdiv.append(input);
									container.before(button);
									container.before(iptdiv);
									container.append(button);
									container.append(iptdiv);
								}
								dialog.show("");
								dialog.textElement.append(container);
							} catch (error) {
								continue;
							}
						}
						
						let searchi = document.getElementById('search-input'+_this.timeInMs);
						if (searchi && typeof searchi.onkeyup === "function") {
							let event = new KeyboardEvent('keyup', {
							  keyCode: 13,
							  key: 'Enter'
							});
							searchi.onkeyup(event);
						}
					}

					function select_tags(event,sign,inputvalue,shelctPath) {
						let text = event.target.textContent;
						if (text && text.indexOf("tags.xlsx") === 0) {
							alert("你的项目地址（Your project address）/ComfyUI_windows_portable/ComfyUI/web/extensions/select_tags/tags.xlsx");
							return;
						}
						if (text && text.indexOf("&&xww") !== -1 ) {
							return;
						}
						let rep = String(_this.timeInMs);
						let regex = new RegExp(rep, 'g');
						let id = event.target.id;
						let btId = id.replace(regex,"-rep-");
						if (sign && sign == "ipt"){
							let idx = btId.lastIndexOf('-ipt-');
							id = btId.substring(0, idx) + '-btn-' + btId.substring(idx + '-ipt-'.length);
							if (_this.SELECTDATA && _this.SELECTDATA[id]) {
								_this.SELECTDATA[id].input = inputvalue;
							}
							return;
						}
						if (event.target.style.color == "white") {
							let index = event.target.id.lastIndexOf('-btn-');
							let iptId = id.substring(0, index) + '-ipt-' + id.substring(index + '-btn-'.length);
							let iptV = document.getElementById(iptId)?.value;
							// let regext = /[\u4e00-\u9fa5/]/g;
							// text = text.replace (regext, "")
							text = text.split("--")[0];
							let ellipsis = text.length > 50 ? "..." : "";
							_this.SELECTDATA[btId] = {textContent:text,input:iptV,path:`${shelctPath}->${text.slice (0, 50)}${ellipsis}`};
							event.target.style.color = "green";
							event.target.style.background = "#CCFF99";
						} else {
							delete _this.SELECTDATA[btId]
							event.target.style.color = "white";
							event.target.style.background = "#222222";
						}
					}
				}

				const dialog = new app.ui.dialog.constructor();
				dialog.element.classList.add("xww-tags-settings");
				
				const ok = dialog.element.querySelector("button");
				const close = document.createElement("button");
				const search = document.createElement("input");
				const selectedDiv = document.createElement("div");
				const searchPath = document.createElement("label");
				const clear = document.createElement("button");
				searchPath.textContent = "";
				ok.textContent = "OK";
				close.textContent = "CLOSE";
				clear.textContent = "CLEAR";
				Object.assign(ok.style, {
					color: "#00FF00",
				});
				Object.assign(close.style, {
					color: "#0000FF",
				});
				Object.assign(clear.style, {
					color: "#FF0000",
				});

				Object.assign(selectedDiv.style, {
					padding: "10px",
					marginBottom: "10px",
					overflow: "auto",
					border: "1px solid #e0e0e0",
					borderRadius: "8px",
					display: "none",
					maxHeight: "100px",
					minHeight: "30px",
				});
				let searchDiv = selectedDiv.cloneNode();
				Object.assign(selectedDiv, {id:"selectedDiv-div"+_this.timeInMs});
				Object.assign(searchDiv, {id:"searchPath-div"+_this.timeInMs});

				Object.assign(searchPath.style, {
					paddingLeft: "10px",
					fontSize: "12px",
					color: "#FFFFFF",
					opacity: "0.9",
					wordWrap: "break-word",
					wordBreak: "break-all",
					textAlign: "left",
					alignItems:"center",
				});

				let selectedLabel = searchPath.cloneNode();
				Object.assign(selectedLabel.style, {
					color: "#a6a9c9",
				});
				Object.assign(selectedLabel, {id:"selected-label"+_this.timeInMs});
				Object.assign(searchPath, {id:"searchPath-label"+_this.timeInMs});

				selectedDiv.append(selectedLabel);
				searchDiv.append(searchPath);

				Object.assign(search, {id:"search-input"+_this.timeInMs});
				Object.assign(search.style, {
					color: "#DDDDDD",
					margin: "10px",
					padding: "10px",
					fontSize: "15px",
					width: "auto",
					textAlign: "center",
					display: "grid",
					alignItems:"center",
				});
				Object.assign(search, {type: "text", placeholder:"search搜索： ** in front of search global, do not add, only search open tabs", autocomplete:"off",value:"", onkeyup: function(event) {
					if (this.value && this.value.length > 0) {
						let patt = /^[\s]*$/;
						let pvalue = patt.test(this.value);
						if (pvalue) {
							return;
						}
					}
					let regex = new RegExp(' ', 'g');
					let sa = "";
					if (_this.SEARChALLDATA && this.value.startsWith("**")) {
						for (let key in _this.SEARChALLDATA) {
							let val = _this.SEARChALLDATA[key];
							let tval = this.value.toLowerCase().replace("**","");
							if (tval && (val.toLowerCase().indexOf(tval) !== -1 || val.replace(regex,'').toLowerCase().indexOf(tval) !== -1)) {
								sa = `${sa}${key}\n`;
							}
						}
					}
					let spl = document.getElementById("searchPath-label"+_this.timeInMs);
					let spd = document.getElementById("searchPath-div"+_this.timeInMs);
					let si = document.getElementById("search-input"+_this.timeInMs);
					if (sa) {
						spd && (spd.style.display = "grid");
						spl && (spl.innerText = sa);
						si && (si.style.color = "green");
					} else {
						spd && (spd.style.display = "none");
						spl && (spl.innerText = "");
						si && (si.style.color = "#DDDDDD");
					}
					let isIn = false;
					if (_this.searchData) {
						let tval = this.value.toLowerCase().replace("**","");
						for (let key in _this.searchData) {
							if (this.value && (key.toLowerCase().indexOf(tval) !== -1 || key.replace(regex,'').toLowerCase().indexOf(tval) !== -1)) {
								let sid = document.getElementById(_this.searchData[key]);
								if (sid) {
									sid.style.display = "grid";
									sid.style.animation = "label-animation 1s infinite";
									isIn = true;
								}
							} else {
								let sid = document.getElementById(_this.searchData[key]);
								if (sid) {
									// 为了避免不必要的gpu消耗，在隐藏时删除动画
									// To avoid unnecessary gpu consumption, remove animation when hiding
									sid.style.display = "none"; 
									sid.style.animation = "none";
								}
							}
						}
						if (isIn) {
							si && (si.style.color = "green");
						} else {
							si && (si.style.color = "#DDDDDD");
						}
					} else {
						si && (si.style.color = "#DDDDDD");
					}
				}});
				ok.onclick = function () {
					let tagsText = "";
					let stdata  = [];
					for (let key in _this.SELECTDATA) {
						if (_this.SELECTDATA.hasOwnProperty(key)) {
							let t = _this.SELECTDATA[key].textContent;
							let i = _this.SELECTDATA[key].input;
							if (i && Number(i)>0){
								stdata.push(`(${t}:${Number(i)})`);
							} else {
								stdata.push(t);
							}
						}
					}
					tagsText = stdata?.join();
					_this.widgets[0].value = tagsText;
					showSelectDiv();
					closeTags();
				};
				close.onclick = function () {
					closeTags();
				};
				clear.onclick = function () {
					let cfm = confirm("确定清除所有选择及修改的内容吗？\nAre you sure to clear all selections and modifications?");
					if (cfm == true){
						_this.SELECTDATA = {};
						_this.widgets[0].value = "";
						if (_this.showingID) {
							let showingID = document.getElementById(_this.showingID);
							showingID.click();
						}
					}
				};
				ok.before(selectedDiv);
				ok.before(searchDiv);
				ok.before(search);
				ok.after(close);
				ok.after(clear);

				function closeTags() {
					let searchi = document.getElementById('search-input'+_this.timeInMs);
					searchi && (searchi.value = "");
					let spl = document.getElementById("searchPath-label"+_this.timeInMs);
					spl && (spl.innerText = "");
					let spd = document.getElementById("searchPath-div"+_this.timeInMs);
					spd && (spd.style.display = "none");
					let si = document.getElementById("search-input"+_this.timeInMs);
					si && (si.style.color = "#DDDDDD");
					dialog.close();
				}

				function showSelectDiv() {
					if ( _this.SELECTDATA){
						let regex = new RegExp(' ', 'g');
						let sd = "";
						for (let k in _this.SELECTDATA) {
							if (_this.SELECTDATA.hasOwnProperty(k)) {
								let path = _this.SELECTDATA[k].path;
								sd = `${sd}${path}\n`;
							}
						}
						let sdd = document.getElementById("selectedDiv-div"+_this.timeInMs);
						let sdl = document.getElementById("selected-label"+_this.timeInMs);
						if (sd) {
							sdd && (sdd.style.display = "grid");
							sdl && (sdl.innerText = sd);
						} else {
							sdd && (sdd.style.display = "none");
							sdl && (sdl.innerText = "");
						}
					}
				}
				return r;
			};
		}
	},
});
