var tw = function(){
	return {
		log: function(obj){
			if(obj == undefined){
				return;
			}

			ejsLog('/tmp/riak_map_reduce.log', JSON.stringify(obj));
		},
		zeroPad: function(num, count){
			var numZeropad = num + '';
			while (numZeropad.length < count) {
				numZeropad = "0" + numZeropad;
			}
			return numZeropad;
		},
		reduce: function(v, r, sum){
			if(v.length === 0){
					return;
			}

			function processField(field, fieldValue, result){
				var fieldValueType = typeof fieldValue;
				var isArray = fieldValue instanceof Array;

				if(isArray){
					result[field] = fieldValue;
				}
				else if(fieldValueType === 'number'){
					if(sum != undefined && sum === false){
						result[field] = fieldValue;
					}
					else{
						if(result[field] == undefined){
							result[field] = 0;
						}

						result[field] += fieldValue;
					}
				}
				else if(fieldValueType === 'object'){
					if(result[field] == undefined){
						result[field] = {};
					}

					for(var objField in fieldValue){
						if(result[field] != undefined){
							processField(objField, fieldValue[objField], result[field]);
						}
					}
				}
				else{
					result[field] = fieldValue;
				}
			}

			for(var index in v){
				for(var field in v[index]) {
					var fieldValue = v[index][field];
					processField(field, fieldValue, r);
				}
			}
		},
		parseDate: function(dateString, clientGmtOffset){
			var dateTime = dateString.replace('Z', '').split('T');

			var timeParts = [];

			dateTime[1].split(':').forEach(function(val){
				var millisParts = val.split('.');

				if(millisParts.length > 1){
					timeParts.push(parseInt(millisParts[0],10));
					timeParts.push(parseInt(millisParts[1],10));
				}
				else{
					timeParts.push(parseInt(val, 10));
				}
			});

			var dateParts = dateTime[0].split('-').map(function(val){return parseInt(val, 10);});

			var date = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2],
				timeParts[0], timeParts[1], timeParts[2], timeParts[3]));

			if(clientGmtOffset != undefined){
				var dateNow = new Date();
				date = new Date(date.setMinutes(date.getMinutes() +
					dateNow.getTimezoneOffset() + clientGmtOffset * 60));
			}

			return date;
		},
		getDateKey: function(date, mode){
			return date.getFullYear() +
				tw.zeroPad((date.getMonth() + 1), 2) +
				( ( mode == 'days' || mode == 'hours' ) ? tw.zeroPad(date.getDate(), 2) : '' ) +
				( mode == 'hours' ? tw.zeroPad(date.getHours(), 2) : '' );
		},
		getDateKeyFromString: function(dateString, mode, clientGmtOffset){
			var date = tw.parseDate(dateString, clientGmtOffset);
			return tw.getDateKey(date, mode);
		},
		rise: function(hash, field, value){
			if(!field){
				return;
			}

			if(!hash[field]){
				hash[field] = 0;
			}

			hash[field] += value;
		},
		getTripsShortInfo: function(tripsParse){
			var tripPath = '';
			var trips = [];
			var isFirst = true;

			var isPrevCont = false;
			var prev = undefined;

			tripsParse.forEach(function(t){
				t.from = t.from;
				t.to = t.to;

				if(prev != undefined && isPrevCont === false && prev != t.from){
					tripPath += trips.join('-') + ';';
					isFirst = true;
					trips = [];
				}

				if(isFirst === true){
					trips.push(t.from);
					isFirst = false;
				}

				if(t.continued !== true){
					trips.push(t.to);
					prev = t.to;
				} else {
					prev = undefined;
				}

				isPrevCont = t.continued;
			});

			tripPath += trips.join('-');
			
			return tripPath;
		},
		fillPassTypeAbsAmounts: function(reservation){
			var priceInfo = reservation.priceInfo;
			
			var totalPassengers = 0;
			var passengersInfo = {
				adtCount: 0,
				cnnCount: 0,
				infCount: 0
			};

			reservation.passengers.forEach(function(passenger){
				passengersInfo[passenger.ageType.toLowerCase() + 'Count']++;
				totalPassengers++;
			});

			var fareSum = 0;
			var taxesSum = 0;

			if(passengersInfo.adtCount > 0){
				fareSum += priceInfo.adtBase * passengersInfo.adtCount;
				taxesSum += priceInfo.adtTaxes * passengersInfo.adtCount;
			}

			if(passengersInfo.cnnCount > 0){
				fareSum += priceInfo.cnnBase * passengersInfo.cnnCount;
				taxesSum += priceInfo.cnnTaxes * passengersInfo.cnnCount;
			}

			if(passengersInfo.infCount > 0){
				fareSum += priceInfo.infBase * passengersInfo.infCount;
				taxesSum += priceInfo.infTaxes * passengersInfo.infCount;
			}
			
			var adtMarkup = 0;
			var cnnMarkup = 0;
			var infMarkup = 0;
			var markup = 0;

			priceInfo.profitParts.forEach(function(profitPart){
				var adtPart = 0;
				var cnnPart = 0;
				var infPart = 0;

				if(profitPart.srcAmtType == 'amount'){
					adtPart = 1 / totalPassengers;
					cnnPart = 1 / totalPassengers;
					infPart = 1 / totalPassengers;
				}
				else if(profitPart.source == 'fare'){
					adtPart = priceInfo.adtBase / fareSum;
					cnnPart = priceInfo.cnnBase / fareSum;
					infPart = priceInfo.infBase / fareSum;
				}
				else if(profitPart.source == 'faretaxes'){
					adtPart = (priceInfo.adtBase + priceInfo.adtTaxes) / (fareSum + taxesSum);
					cnnPart = (priceInfo.cnnBase + priceInfo.cnnTaxes) / (fareSum + taxesSum);
					infPart = (priceInfo.infBase + priceInfo.infTaxes) / (fareSum + taxesSum);
				}
				else{
					adtPart = 1 / totalPassengers;
					cnnPart = 1 / totalPassengers;
					infPart = 1 / totalPassengers;
				}

				profitPart.adtAbsAmt = profitPart.absAmt * (adtPart || 0);
				profitPart.cnnAbsAmt = profitPart.absAmt * (cnnPart || 0);
				profitPart.infAbsAmt = profitPart.absAmt * (infPart || 0);
				
				if(profitPart.type == 'atop'){
					adtMarkup += profitPart.adtAbsAmt;
					cnnMarkup += profitPart.cnnAbsAmt;
					infMarkup += profitPart.infAbsAmt;
					markup += profitPart.absAmt;
				}
			});

			var adtPart = (priceInfo.adtBase + priceInfo.adtTaxes + adtMarkup) / (fareSum + taxesSum + markup);				
			var cnnPart = (priceInfo.cnnBase + priceInfo.cnnTaxes + cnnMarkup) / (fareSum + taxesSum + markup);				
			var infPart = (priceInfo.infBase + priceInfo.infTaxes + infMarkup) / (fareSum + taxesSum + markup);
			
			if(reservation.cardAmount != undefined){
				reservation.adtCardAmount = reservation.cardAmount * (adtPart || 0);
				reservation.cnnCardAmount = reservation.cardAmount * (cnnPart || 0);
				reservation.infCardAmount = reservation.cardAmount * (infPart || 0);

				if(reservation.cashAmount != undefined && markup !== 0){
					reservation.adtCashAmount = reservation.cashAmount * adtMarkup / markup;
					reservation.cnnCashAmount = reservation.cashAmount * cnnMarkup / markup;
					reservation.infCashAmount = reservation.cashAmount * infMarkup / markup;
				}
			}
			
			if(reservation.pgCommission != undefined){
				reservation.pgCommission.adtAmount = 
					 reservation.pgCommission.amount * adtPart;

				reservation.pgCommission.cnnAmount = 
					reservation.pgCommission.amount * cnnPart;

				reservation.pgCommission.infAmount = 
					reservation.pgCommission.amount * infPart;

				reservation.pgCommission.adtCommission = 
					reservation.pgCommission.commission * adtPart;

				reservation.pgCommission.cnnCommission = 
					reservation.pgCommission.commission * cnnPart;

				reservation.pgCommission.infCommission = 
					reservation.pgCommission.commission * infPart;
			}
		}
	};
}();

if(typeof module !== 'undefined' && module.exports){
	module.exports = tw;
}