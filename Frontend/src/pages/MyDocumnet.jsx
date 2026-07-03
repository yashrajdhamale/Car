import React from 'react'

const MyDocumnet = () => {
    // Your JSX content here (e.g., tables, forms, etc.)
    return (
        <div>

            <form name="form1" method="post" id="form1">
                <table table width="100%" >
                    <tbody>
                        <tr>
                            <td>
                                <div className="text-center invoice-btn">
                                    <input type="hidden" name="HdnValue" id="HdnValue" />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div id="table1">
                                    <table style={{ width: "100%" }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ width: "45%" }}>
                                                    <table
                                                        background="../img/JJMCOEWatermark.png"
                                                        cellPadding={2}
                                                        cellSpacing={1}
                                                        height="auto"
                                                        style={{
                                                            border: "2px solid",
                                                            borderCollapse: "collapse",
                                                            backgroundRepeat: "no-repeat",
                                                            backgroundPositionX: "center",
                                                            backgroundPositionY: "center",
                                                            backgroundAttachment: "background-size: 30% 30%"
                                                        }}
                                                        width={470}
                                                    >
                                                        <tbody>
                                                            <tr>
                                                                <td colSpan={2}>
                                                                    <img
                                                                        alt=""
                                                                        height={100}
                                                                        src="../img/JJMCOE.png"
                                                                        width={450}
                                                                    />
                                                                </td>
                                                            </tr>
                                                            <tr style={{ backgroundColor: "#CFCFCF" }}>
                                                                <td
                                                                    align="center"
                                                                    colSpan={2}
                                                                    style={{
                                                                        border: "1px solid black",
                                                                        
                                                                        backgroundColor: "#CFCFCF"
                                                                    }}

                                                                >
                                                                    <span style={{ fontSize: 10 }}>
                                                                        <strong>MISCELLANEOUS FEE RECEIPT</strong>
                                                                        &nbsp;2023-2024&nbsp;(Student Copy)
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr style={{ border: "1px solid black" }}>
                                                                <td
                                                                    style={{
                                                                        width: "60%",
                                                                        border: "1px solid black",
                                                                        
                                                                    }}

                                                                >
                                                                    <span style={{ fontSize: 11 }}>
                                                                        <strong>Reg No : </strong>IT-20004
                                                                    </span>
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        width: "40%",
                                                                        border: "1px solid black",
                                                                        
                                                                    }}

                                                                >
                                                                    <span style={{ fontSize: 11 }}>
                                                                        <strong>Receipt No : </strong>MR/2023-2024/010252
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr style={{ border: "1px solid black" }}>
                                                                <td
                                                                    style={{
                                                                        width: "60%",
                                                                        border: "1px solid black",
                                                                        
                                                                    }}

                                                                >
                                                                    <span style={{ fontSize: 11 }}>
                                                                        <strong>Name : </strong>BHOSALE PRAYAG PRAMOD
                                                                    </span>
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        width: "40%",
                                                                        border: "1px solid black",
                                                                        
                                                                    }}

                                                                >
                                                                    <span style={{ fontSize: 11 }}>
                                                                        <strong>Date : </strong>06/03/2024
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr style={{ border: "1px solid black" }}>
                                                                <td
                                                                    style={{
                                                                        width: "60%",
                                                                        border: "1px solid black",
                                                                        
                                                                    }}

                                                                >
                                                                    <span style={{ fontSize: 11 }}>
                                                                        <strong>Class:</strong> BE
                                                                    </span>
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        width: "40%",
                                                                        border: "1px solid black",
                                                                        
                                                                    }}

                                                                >
                                                                    <span style={{ fontSize: 11 }}>
                                                                        <strong>Category :</strong>
                                                                        <strong> </strong>SC
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr style={{ border: "1px solid black" }}>
                                                                <td
                                                                    colSpan={2}
                                                                    style={{
                                                                        width: "50%",
                                                                        border: "1px solid black",
                                                                        
                                                                    }}

                                                                >
                                                                    <span style={{ fontSize: 11 }}>
                                                                        <strong>Course: </strong>Information Techonology
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr style={{ border: "1px solid black" }}>
                                                                <td
                                                                    colSpan={2}
                                                                    style={{
                                                                        border: "1px solid black",
                                                                        
                                                                    }}

                                                                >
                                                                    <span style={{ fontSize: 11 }}>
                                                                        <strong>Payment Type : </strong>
                                                                    
                                                                        <strong>
                                                                            {" "}
                                                                            Payment Gateway
                                                                        </strong>{" "}
                                                                       
                                                                    
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr style={{ border: "1px solid black" }}>
                                                                <td
                                                                    colSpan={2}
                                                                    style={{
                                                                        border: "1px solid black",
                                                                        
                                                                    }}

                                                                >
                                                                    <span style={{ fontSize: 11 }}>
                                                                        <strong>Cheque/DD/UTR No: </strong>IOIT0000057639
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr style={{ border: "1px solid black" }}>
                                                                <td
                                                                    style={{
                                                                        border: "1px solid black",
                                                                        
                                                                    }}

                                                                >
                                                                    <span style={{ fontSize: 11 }}>
                                                                        <strong>Bank : </strong>
                                                                    </span>
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        border: "1px solid black",
                                                                        
                                                                    }}

                                                                >
                                                                    <span style={{ fontSize: 11 }}>
                                                                        <strong>Branch:&nbsp;</strong>
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr style={{ border: "1px solid black" }}>
                                                                <td
                                                                    colSpan={2}
                                                                    style={{
                                                                        border: "1px solid black",
                                                                        
                                                                    }}

                                                                >
                                                                    <span style={{ fontSize: 11 }}>
                                                                        <strong>Deposit Date: </strong>
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr style={{ border: "1px solid black" }}>
                                                                <td colSpan={2}>
                                                                    <span style={{ fontSize: 10 }}>
                                                                        <table
                                                                            cellPadding={2}
                                                                            cellSpacing={0}
                                                                            height={104}
                                                                            width="100%"
                                                                        >
                                                                            <tbody>
                                                                                <tr style={{ backgroundColor: "#CFCFCF" }}>
                                                                                    <td
                                                                                        style={{
                                                                                            width: "15%",
                                                                                            border: "1px solid black",
                                                                                            borderBottom: "0px solid black",
                                                                                            
                                                                                        }}
                                                                                        valign="top"
                                                                                    >
                                                                                        <span style={{ fontSize: 12 }}>
                                                                                            <strong>Sr.No</strong>
                                                                                        </span>
                                                                                    </td>
                                                                                    <td
                                                                                        style={{
                                                                                            width: "45%",
                                                                                            border: "1px solid black",
                                                                                            borderLeft: "0px solid black",
                                                                                            borderBottom: "0px solid black",
                                                                                            
                                                                                            textAlign: "center"
                                                                                        }}
                                                                                        valign="top"
                                                                                    >
                                                                                        <span style={{ fontSize: 12 }}>
                                                                                            <strong>Particulars</strong>
                                                                                        </span>
                                                                                    </td>
                                                                                    <td
                                                                                        style={{
                                                                                            border: "1px solid black",
                                                                                            borderLeft: "0px solid black",
                                                                                            borderBottom: "0px solid black",
                                                                                            
                                                                                            textAlign: "center"
                                                                                        }}
                                                                                        valign="top"
                                                                                    >
                                                                                        <span style={{ fontSize: 12 }}>
                                                                                            <strong>Amount(Rs)</strong>
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>{" "}
                                                                                <tr style={{ border: "1px solid black" }}>
                                                                                    {" "}
                                                                                    <td
                                                                                        style={{
                                                                                            border: "1px solid black",
                                                                                            borderBottom: "0px solid black",
                                                                                            
                                                                                        }}

                                                                                        align="center"
                                                                                    >
                                                                                        <span style={{ fontSize: 10 }}> 1 </span>
                                                                                    </td>{" "}
                                                                                    <td
                                                                                        style={{
                                                                                            border: "1px solid black",
                                                                                            borderBottom: "0px solid black",
                                                                                            borderLeft: "0px solid black",
                                                                                            
                                                                                        }}

                                                                                    >
                                                                                        {" "}
                                                                                        <span style={{ fontSize: 10 }}>
                                                                                            {" "}
                                                                                            Examination Fee{" "}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td
                                                                                        style={{
                                                                                            border: "1px solid black",
                                                                                            borderLeft: "0px solid black",
                                                                                            borderBottom: "0px solid black",
                                                                                            
                                                                                            textAlign: "right"
                                                                                        }}

                                                                                    >
                                                                                        <span style={{ fontSize: 10 }}>
                                                                                            {" "}
                                                                                            1655.00{" "}
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                                <tr style={{ border: "1px solid black" }}>
                                                                                    {" "}
                                                                                    <td
                                                                                        align="right"
                                                                                        colSpan={2}
                                                                                        style={{
                                                                                            border: "1px solid black",
                                                                                            borderBottom: "0px solid black",
                                                                                            
                                                                                        }}

                                                                                    >
                                                                                        {" "}
                                                                                        <span style={{ fontSize: 10 }}>
                                                                                            <strong> Total :</strong>
                                                                                        </span>
                                                                                    </td>{" "}
                                                                                    <td
                                                                                        style={{
                                                                                            border: "1px solid black",
                                                                                            borderLeft: "0px solid black",
                                                                                            borderBottom: "0px solid black",
                                                                                            
                                                                                            textAlign: "right"
                                                                                        }}

                                                                                    >
                                                                                        {" "}
                                                                                        <span style={{ fontSize: 10 }}>
                                                                                            {" "}
                                                                                            1655.00{" "}
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                                <tr style={{ border: "1px solid black" }}>
                                                                                    {" "}
                                                                                    <td
                                                                                        align="left"
                                                                                        colSpan={3}
                                                                                        style={{
                                                                                            border: "1px solid black",
                                                                                            
                                                                                        }}

                                                                                    >
                                                                                        {" "}
                                                                                        <span style={{ fontSize: 10 }}>
                                                                                            {" "}
                                                                                            In Word: &nbsp;
                                                                                            <strong>
                                                                                                {" "}
                                                                                                One Thousand Six Hundred Fifty Five
                                                                                            </strong>{" "}
                                                                                            &nbsp; Only.
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>{" "}
                                                                        </table>{" "}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td align="left" colSpan={2}>
                                                                    <span style={{ fontSize: 11 }}>
                                                                        <strong>Narration :</strong> &nbsp;
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr style={{ borderBottom: "1px solid black" }}>
                                                                <td
                                                                    align="left"
                                                                    colSpan={2}
                                                                    style={{ borderBottom: "1px solid black" }}
                                                                >
                                                                    <p style={{ marginTop: 15 }}>&nbsp;</p>
                                                                    <p>
                                                                        <span style={{ fontSize: 11 }}>
                                                                            <strong>
                                                                                <span
                                                                                    style={{ float: "left", paddingLeft: 15 }}
                                                                                >
                                                                                    Remark
                                                                                </span>
                                                                                <span
                                                                                    style={{ float: "right", paddingRight: 40 }}
                                                                                >
                                                                                    Cashier
                                                                                </span>
                                                                            </strong>
                                                                        </span>
                                                                    </p>
                                                                    <p>&nbsp;</p>
                                                                </td>
                                                            </tr>
                                                            <tr style={{ border: "1px solid black" }}>
                                                                <td
                                                                    colSpan={2}
                                                                    style={{ borderBottom: "1px solid black" }}

                                                                >
                                                                    <table>
                                                                        <tbody>
                                                                            <tr>
                                                                                <td valign="centerop" width="10%">
                                                                                    <span style={{ fontSize: 11 }}>
                                                                                        <strong>Note :</strong>
                                                                                    </span>
                                                                                </td>
                                                                                <td width="85%">
                                                                                    <span style={{ fontSize: 11 }}>
                                                                                        Fees once paid will not be refunded. This
                                                                                        receipt should be produced by the student
                                                                                        at any time as and when required.
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <p>&nbsp;</p>
                                </div>
                                <br />
                            </td>
                        </tr>
                    </tbody>
                </table >
            </form>
        </div>
    
        
    //  <td>
    //                             <div id="table1">
    //                                 <table style={{ width: "100%" }}>
    //                                     <tbody>
    //                                         <tr>
    //                                             <td style={{ width: "45%" }}>
    //                                                 <table
    //                                                     background="../img/JJMCOEWatermark.png"
    //                                                     cellPadding={2}
    //                                                     cellSpacing={1}
    //                                                     height="auto"
    //                                                     style={{
    //                                                         border: "2px solid",
    //                                                         borderCollapse: "collapse",
    //                                                         backgroundRepeat: "no-repeat",
    //                                                         backgroundPositionX: "center",
    //                                                         backgroundPositionY: "center",
    //                                                         backgroundAttachment: "background-size: 30% 30%"
    //                                                     }}
    //                                                     width={470}
    //                                                 >
    //                                                     <tbody>
    //                                                         <tr>
    //                                                             <td colSpan={2}>
    //                                                                 <img
    //                                                                     alt=""
    //                                                                     height={100}
    //                                                                     src="../img/JJMCOE.png"
    //                                                                     width={450}
    //                                                                 />
    //                                                             </td>
    //                                                         </tr>
    //                                                         <tr style={{ backgroundColor: "#CFCFCF" }}>
    //                                                             <td
    //                                                                 align="center"
    //                                                                 colSpan={2}
    //                                                                 style={{
    //                                                                     border: "1px solid black",
                                                                        
    //                                                                     backgroundColor: "#CFCFCF"
    //                                                                 }}

    //                                                             >
    //                                                                 <span style={{ fontSize: 10 }}>
    //                                                                     <strong>MISCELLANEOUS FEE RECEIPT</strong>
    //                                                                     &nbsp;2023-2024&nbsp;(Student Copy)
    //                                                                 </span>
    //                                                             </td>
    //                                                         </tr>
    //                                                         <tr style={{ border: "1px solid black" }}>
    //                                                             <td
    //                                                                 style={{
    //                                                                     width: "60%",
    //                                                                     border: "1px solid black",
                                                                        
    //                                                                 }}

    //                                                             >
    //                                                                 <span style={{ fontSize: 11 }}>
    //                                                                     <strong>Reg No : </strong>IT-20004
    //                                                                 </span>
    //                                                             </td>
    //                                                             <td
    //                                                                 style={{
    //                                                                     width: "40%",
    //                                                                     border: "1px solid black",
                                                                        
    //                                                                 }}

    //                                                             >
    //                                                                 <span style={{ fontSize: 11 }}>
    //                                                                     <strong>Receipt No : </strong>MR/2023-2024/010252
    //                                                                 </span>
    //                                                             </td>
    //                                                         </tr>
    //                                                         <tr style={{ border: "1px solid black" }}>
    //                                                             <td
    //                                                                 style={{
    //                                                                     width: "60%",
    //                                                                     border: "1px solid black",
                                                                        
    //                                                                 }}

    //                                                             >
    //                                                                 <span style={{ fontSize: 11 }}>
    //                                                                     <strong>Name : </strong>BHOSALE PRAYAG PRAMOD
    //                                                                 </span>
    //                                                             </td>
    //                                                             <td
    //                                                                 style={{
    //                                                                     width: "40%",
    //                                                                     border: "1px solid black",
                                                                        
    //                                                                 }}

    //                                                             >
    //                                                                 <span style={{ fontSize: 11 }}>
    //                                                                     <strong>Date : </strong>06/03/2024
    //                                                                 </span>
    //                                                             </td>
    //                                                         </tr>
    //                                                         <tr style={{ border: "1px solid black" }}>
    //                                                             <td
    //                                                                 style={{
    //                                                                     width: "60%",
    //                                                                     border: "1px solid black",
                                                                        
    //                                                                 }}

    //                                                             >
    //                                                                 <span style={{ fontSize: 11 }}>
    //                                                                     <strong>Class:</strong> BE
    //                                                                 </span>
    //                                                             </td>
    //                                                             <td
    //                                                                 style={{
    //                                                                     width: "40%",
    //                                                                     border: "1px solid black",
                                                                        
    //                                                                 }}

    //                                                             >
    //                                                                 <span style={{ fontSize: 11 }}>
    //                                                                     <strong>Category :</strong>
    //                                                                     <strong> </strong>SC
    //                                                                 </span>
    //                                                             </td>
    //                                                         </tr>
    //                                                         <tr style={{ border: "1px solid black" }}>
    //                                                             <td
    //                                                                 colSpan={2}
    //                                                                 style={{
    //                                                                     width: "50%",
    //                                                                     border: "1px solid black",
                                                                        
    //                                                                 }}

    //                                                             >
    //                                                                 <span style={{ fontSize: 11 }}>
    //                                                                     <strong>Course: </strong>Information Techonology
    //                                                                 </span>
    //                                                             </td>
    //                                                         </tr>
    //                                                         <tr style={{ border: "1px solid black" }}>
    //                                                             <td
    //                                                                 colSpan={2}
    //                                                                 style={{
    //                                                                     border: "1px solid black",
                                                                        
    //                                                                 }}

    //                                                             >
    //                                                                 <span style={{ fontSize: 11 }}>
    //                                                                     <strong>Payment Type : </strong>
                                                                    
    //                                                                     <strong>
    //                                                                         {" "}
    //                                                                         Payment Gateway
    //                                                                     </strong>{" "}
                                                                       
                                                                    
    //                                                                 </span>
    //                                                             </td>
    //                                                         </tr>
    //                                                         <tr style={{ border: "1px solid black" }}>
    //                                                             <td
    //                                                                 colSpan={2}
    //                                                                 style={{
    //                                                                     border: "1px solid black",
                                                                        
    //                                                                 }}

    //                                                             >
    //                                                                 <span style={{ fontSize: 11 }}>
    //                                                                     <strong>Cheque/DD/UTR No: </strong>IOIT0000057639
    //                                                                 </span>
    //                                                             </td>
    //                                                         </tr>
    //                                                         <tr style={{ border: "1px solid black" }}>
    //                                                             <td
    //                                                                 style={{
    //                                                                     border: "1px solid black",
                                                                        
    //                                                                 }}

    //                                                             >
    //                                                                 <span style={{ fontSize: 11 }}>
    //                                                                     <strong>Bank : </strong>
    //                                                                 </span>
    //                                                             </td>
    //                                                             <td
    //                                                                 style={{
    //                                                                     border: "1px solid black",
                                                                        
    //                                                                 }}

    //                                                             >
    //                                                                 <span style={{ fontSize: 11 }}>
    //                                                                     <strong>Branch:&nbsp;</strong>
    //                                                                 </span>
    //                                                             </td>
    //                                                         </tr>
    //                                                         <tr style={{ border: "1px solid black" }}>
    //                                                             <td
    //                                                                 colSpan={2}
    //                                                                 style={{
    //                                                                     border: "1px solid black",
                                                                        
    //                                                                 }}

    //                                                             >
    //                                                                 <span style={{ fontSize: 11 }}>
    //                                                                     <strong>Deposit Date: </strong>
    //                                                                 </span>
    //                                                             </td>
    //                                                         </tr>
    //                                                         <tr style={{ border: "1px solid black" }}>
    //                                                             <td colSpan={2}>
    //                                                                 <span style={{ fontSize: 10 }}>
    //                                                                     <table
    //                                                                         cellPadding={2}
    //                                                                         cellSpacing={0}
    //                                                                         height={104}
    //                                                                         width="100%"
    //                                                                     >
    //                                                                         <tbody>
    //                                                                             <tr style={{ backgroundColor: "#CFCFCF" }}>
    //                                                                                 <td
    //                                                                                     style={{
    //                                                                                         width: "15%",
    //                                                                                         border: "1px solid black",
    //                                                                                         borderBottom: "0px solid black",
                                                                                            
    //                                                                                     }}
    //                                                                                     valign="top"
    //                                                                                 >
    //                                                                                     <span style={{ fontSize: 12 }}>
    //                                                                                         <strong>Sr.No</strong>
    //                                                                                     </span>
    //                                                                                 </td>
    //                                                                                 <td
    //                                                                                     style={{
    //                                                                                         width: "45%",
    //                                                                                         border: "1px solid black",
    //                                                                                         borderLeft: "0px solid black",
    //                                                                                         borderBottom: "0px solid black",
                                                                                            
    //                                                                                         textAlign: "center"
    //                                                                                     }}
    //                                                                                     valign="top"
    //                                                                                 >
    //                                                                                     <span style={{ fontSize: 12 }}>
    //                                                                                         <strong>Particulars</strong>
    //                                                                                     </span>
    //                                                                                 </td>
    //                                                                                 <td
    //                                                                                     style={{
    //                                                                                         border: "1px solid black",
    //                                                                                         borderLeft: "0px solid black",
    //                                                                                         borderBottom: "0px solid black",
                                                                                            
    //                                                                                         textAlign: "center"
    //                                                                                     }}
    //                                                                                     valign="top"
    //                                                                                 >
    //                                                                                     <span style={{ fontSize: 12 }}>
    //                                                                                         <strong>Amount(Rs)</strong>
    //                                                                                     </span>
    //                                                                                 </td>
    //                                                                             </tr>{" "}
    //                                                                             <tr style={{ border: "1px solid black" }}>
    //                                                                                 {" "}
    //                                                                                 <td
    //                                                                                     style={{
    //                                                                                         border: "1px solid black",
    //                                                                                         borderBottom: "0px solid black",
                                                                                            
    //                                                                                     }}

    //                                                                                     align="center"
    //                                                                                 >
    //                                                                                     <span style={{ fontSize: 10 }}> 1 </span>
    //                                                                                 </td>{" "}
    //                                                                                 <td
    //                                                                                     style={{
    //                                                                                         border: "1px solid black",
    //                                                                                         borderBottom: "0px solid black",
    //                                                                                         borderLeft: "0px solid black",
                                                                                            
    //                                                                                     }}

    //                                                                                 >
    //                                                                                     {" "}
    //                                                                                     <span style={{ fontSize: 10 }}>
    //                                                                                         {" "}
    //                                                                                         Examination Fee{" "}
    //                                                                                     </span>
    //                                                                                 </td>
    //                                                                                 <td
    //                                                                                     style={{
    //                                                                                         border: "1px solid black",
    //                                                                                         borderLeft: "0px solid black",
    //                                                                                         borderBottom: "0px solid black",
                                                                                            
    //                                                                                         textAlign: "right"
    //                                                                                     }}

    //                                                                                 >
    //                                                                                     <span style={{ fontSize: 10 }}>
    //                                                                                         {" "}
    //                                                                                         1655.00{" "}
    //                                                                                     </span>
    //                                                                                 </td>
    //                                                                             </tr>
    //                                                                             <tr style={{ border: "1px solid black" }}>
    //                                                                                 {" "}
    //                                                                                 <td
    //                                                                                     align="right"
    //                                                                                     colSpan={2}
    //                                                                                     style={{
    //                                                                                         border: "1px solid black",
    //                                                                                         borderBottom: "0px solid black",
                                                                                            
    //                                                                                     }}

    //                                                                                 >
    //                                                                                     {" "}
    //                                                                                     <span style={{ fontSize: 10 }}>
    //                                                                                         <strong> Total :</strong>
    //                                                                                     </span>
    //                                                                                 </td>{" "}
    //                                                                                 <td
    //                                                                                     style={{
    //                                                                                         border: "1px solid black",
    //                                                                                         borderLeft: "0px solid black",
    //                                                                                         borderBottom: "0px solid black",
                                                                                            
    //                                                                                         textAlign: "right"
    //                                                                                     }}

    //                                                                                 >
    //                                                                                     {" "}
    //                                                                                     <span style={{ fontSize: 10 }}>
    //                                                                                         {" "}
    //                                                                                         1655.00{" "}
    //                                                                                     </span>
    //                                                                                 </td>
    //                                                                             </tr>
    //                                                                             <tr style={{ border: "1px solid black" }}>
    //                                                                                 {" "}
    //                                                                                 <td
    //                                                                                     align="left"
    //                                                                                     colSpan={3}
    //                                                                                     style={{
    //                                                                                         border: "1px solid black",
                                                                                            
    //                                                                                     }}

    //                                                                                 >
    //                                                                                     {" "}
    //                                                                                     <span style={{ fontSize: 10 }}>
    //                                                                                         {" "}
    //                                                                                         In Word: &nbsp;
    //                                                                                         <strong>
    //                                                                                             {" "}
    //                                                                                             One Thousand Six Hundred Fifty Five
    //                                                                                         </strong>{" "}
    //                                                                                         &nbsp; Only.
    //                                                                                     </span>
    //                                                                                 </td>
    //                                                                             </tr>
    //                                                                         </tbody>{" "}
    //                                                                     </table>{" "}
    //                                                                 </span>
    //                                                             </td>
    //                                                         </tr>
    //                                                         <tr>
    //                                                             <td align="left" colSpan={2}>
    //                                                                 <span style={{ fontSize: 11 }}>
    //                                                                     <strong>Narration :</strong> &nbsp;
    //                                                                 </span>
    //                                                             </td>
    //                                                         </tr>
    //                                                         <tr style={{ borderBottom: "1px solid black" }}>
    //                                                             <td
    //                                                                 align="left"
    //                                                                 colSpan={2}
    //                                                                 style={{ borderBottom: "1px solid black" }}
    //                                                             >
    //                                                                 <p style={{ marginTop: 15 }}>&nbsp;</p>
    //                                                                 <p>
    //                                                                     <span style={{ fontSize: 11 }}>
    //                                                                         <strong>
    //                                                                             <span
    //                                                                                 style={{ float: "left", paddingLeft: 15 }}
    //                                                                             >
    //                                                                                 Remark
    //                                                                             </span>
    //                                                                             <span
    //                                                                                 style={{ float: "right", paddingRight: 40 }}
    //                                                                             >
    //                                                                                 Cashier
    //                                                                             </span>
    //                                                                         </strong>
    //                                                                     </span>
    //                                                                 </p>
    //                                                                 <p>&nbsp;</p>
    //                                                             </td>
    //                                                         </tr>
    //                                                         <tr style={{ border: "1px solid black" }}>
    //                                                             <td
    //                                                                 colSpan={2}
    //                                                                 style={{ borderBottom: "1px solid black" }}

    //                                                             >
    //                                                                 <table>
    //                                                                     <tbody>
    //                                                                         <tr>
    //                                                                             <td valign="centerop" width="10%">
    //                                                                                 <span style={{ fontSize: 11 }}>
    //                                                                                     <strong>Note :</strong>
    //                                                                                 </span>
    //                                                                             </td>
    //                                                                             <td width="85%">
    //                                                                                 <span style={{ fontSize: 11 }}>
    //                                                                                     Fees once paid will not be refunded. This
    //                                                                                     receipt should be produced by the student
    //                                                                                     at any time as and when required.
    //                                                                                 </span>
    //                                                                             </td>
    //                                                                         </tr>
    //                                                                     </tbody>
    //                                                                 </table>
    //                                                             </td>
    //                                                         </tr>
    //                                                     </tbody>
    //                                                 </table>
    //                                             </td>
    //                                         </tr>
    //                                     </tbody>
    //                                 </table>
    //                                 <p>&nbsp;</p>
    //                             </div>
    //                             <br />
    //                         </td>
    
    );

}

export default MyDocumnet;