 if(_body.should.have.property("code") && _body.should.have.property("consignments")){
    let consigments = _body.consignments[0];
    let entryLength = consigments.consignmentEntries.length-1;
    let responseProductCode = consigments.consignmentEntries[entryLength].orderEntry.product.code;

    expect(responseProductCode).to.equal(productCode);
}