import React, { useEffect, useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
// import PdfCard from "./PdfCard";
// import './pdfh.css'
import ReactDOM from 'react-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MyDocumnet from './MyDocumnet';
import { Transaction } from 'firebase/firestore';
import { Spinner } from "@material-tailwind/react";
import { useNavigate, useLocation, useParams } from 'react-router-dom';

function PdfHome() {


    const location = useLocation();
    const { state } = location;
    const navigate = useNavigate();

    const [formdataT, setformdataT] = useState(null);
    const [DataPrepared, setDataPrepared] = useState(false);




    useEffect(() => {

        if (state && (state.flag) == "1") {
            if (state && state.send_Data) {
                console.log('Data received:', state.send_Data);
                setformdataT(state.send_Data);
                setDataPrepared(true);
            } else {
                console.log('No data received.');
            }
        }
        // else {
        //     setError("");
        // }
    }, [state]);

    useEffect(() => {
 
        if (DataPrepared) {
            setTimeout(() => { downloadPdf(); }, 1000);
        }

    }, [DataPrepared]);







    const formRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const FontSize = 13;
    // const downloadPdf = () => {
    //     const element = document.getElementById('myForm');
    //     html2pdf().from(element).set({
    //         margin: [10, 20, 0, 0] // [top, right, bottom, left]
    //     }).save();
    // };

    // const downloadPdf = () => {
    //     const element = document.getElementById('myForm');
    //     html2pdf().from(element).set({
    //         margin: [10, 20, 0, 0], // [top, right, bottom, left]
    //         filename: 'Travelog_Holidays.pdf',
    //         image: { type: 'jpeg', quality: 0.98 },
    //         html2canvas: { scale: 2 },
    //         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    //     }).save();
    // };



    const downloadPdf = () => {
        const element = document.getElementById('myForm');
        html2pdf().from(element).set({
            margin: [10, 20, 0, 0], // [top, right, bottom, left]
            filename: 'Travelog_Holidays.pdf',
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 3, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).save();

        // let send_Data = ;

        let send_Data = {
            formData: formdataT,
        };

        console.log("downloadPdf = ", send_Data);



        navigate('/bookingdone', { state: { send_Data } });

    };





    const [formdata, setformdata] = useState({
        Name: "PRAYAG PRAMOD BHOSALE",
        Date: "20/05/2024",
        Phone1: 9089789098,
        Phone2: 9089789098,
        BookedDate: '05/06/2024',
        Email: "Mrprayag77@gmail.com",
        GuestCount: [2, 1],
        Duration: [2, 2],
        PickupDate: '10/2/2024',
        PackageName: 'Munnar Weekend Break',
        PackageCost: 34581,
        upi: "prayagbh@sbi",
        TransactionID: 'IOIT0000057639',
    });








    const smallNumbers = [
        'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'
    ];

    const tens = [
        '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];

    const scales = ['Thousand', 'Million', 'Billion'];

    function convertHundreds(num) {
        let result = '';

        if (num > 99) {
            result += smallNumbers[Math.floor(num / 100)] + ' Hundred';
            num %= 100;
            if (num > 0) result += ' ';
        }

        if (num > 19) {
            result += tens[Math.floor(num / 10)];
            num %= 10;
            if (num > 0) result += '-';
        }

        if (num > 0) {
            result += smallNumbers[num];
        }

        return result;
    }

    function convertNumberToWords(num) {
        if (num === 0) return 'Zero';

        let result = '';
        let scaleIndex = -1;

        while (num > 0) {
            const chunk = num % 1000;

            if (chunk > 0) {
                let chunkText = convertHundreds(chunk);
                if (scaleIndex >= 0) {
                    chunkText += ' ' + scales[scaleIndex];
                }
                result = chunkText + (result ? ' ' + result : '');
            }

            num = Math.floor(num / 1000);
            scaleIndex++;
        }

        return result;
    }




    // const cards = { maxWidth: "1200px", margin: "0 auto", display: "grid", gap: "1rem", padding: '20px', gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }
    return (

        <>
            {DataPrepared ? 

                <div>
                    {/* <h2 style={{ textAlign: 'center' }}>List of invoices</h2>
    <div style={cards}> */}



                    {/* <button
            disabled={isDownloading}
            onClick={downloadPDF}
            className="disabled:opacity-50 cursor-pointer"
        >
            {isDownloading ? 'Downloading...' : 'Download PDF'}
        </button> */}


                    {/* <PDFDownloadLink document={<MyDocumnet />} fileName="receipt.pdf">
            {({ blob, url, loading, error }) => (loading ? 'Loading document...' : 'Download now!')}
        </PDFDownloadLink> */}




                    {/* 
        <br />
        <br />
        <br />
         */}


                    <div className="relative">

                        {/*  */}
                        <form name="form1" id="myForm"
                            style={{ marginTop: '50px', marginLeft: '30px' }}
                        >
                            <table width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                            <div className="text-center invoice-btn">
                                                <input type="hidden" name="HdnValue" id="HdnValue"  />
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
                                                                        {/* <tr>
                                                        <td colSpan={2}>
                                                            <img
                                                                className=' h-32'
                                                                alt="prayag hii"
                                                                // height={100}
                                                                src={"https://storage.travelog.com/347941/travelog%20car%20rental%20templete%20(19).png"}

                                                            width={450}
                                                            />
                                                        </td>
                                                    </tr> */}
                                                                        <tr style={{ backgroundColor: "#CFCFCF" }}>
                                                                            <td
                                                                                align="center"
                                                                                colSpan={2}
                                                                                style={{
                                                                                    border: "1px solid black",
                                                                                    fontFamily: "verdana,geneva,sans-serif",
                                                                                    backgroundColor: "#CFCFCF",
                                                                                    padding: '15px',
                                                                                }}
                                                                                valign="center"
                                                                            >
                                                                                <span style={{ fontSize: 20 }}>
                                                                                    <strong>HOLIDAY FEE RECEIPT</strong>
                                                                                    {/* &nbsp;2023-2024&nbsp; */}
                                                                                    &nbsp;  (Owner Copy)
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                        <tr
                                                                        // style={{ border: "1px solid black" }}
                                                                        >
                                                                            <td
                                                                                style={{
                                                                        // width: "100%",
                                                                        // border: "1px solid black",

                                                                                    fontFamily: "verdana,geneva,sans-serif",
                                                                                    padding: '8px 8px 8px 3px',
                                                                                }}
                                                                                valign="center"
                                                                            >
                                                                                <span style={{ fontSize: 14 }}>
                                                                                    <strong>Reg No :

                                                                                    </strong>
                                                                                    {" "}    {formdataT.formData.RegNumber1}
                                                                                </span>
                                                                            </td>
                                                                            {/* <td
                                                            style={{
                                                                width: "40%",
                                                                border: "1px solid black",
                                                                fontFamily: "verdana,geneva,sans-serif"
                                                            }}
                                                            valign="center"
                                                        >
                                                            <span style={{ fontSize:  FontSize || 11 }}>
                                                                <strong>Receipt No : </strong>MR/2023-2024/010252
                                                            </span>
                                                        </td> */}
                                                                        </tr>
                                                                        <tr style={{ border: "1px solid black" }}>
                                                                            <td
                                                                                style={{
                                                                                    width: "60%",
                                                                                    border: "1px solid black",
                                                                                    fontFamily: "verdana,geneva,sans-serif",
                                                                                }}
                                                                                valign="center"
                                                                            >
                                                                                <span style={{ fontSize: FontSize || 11 }}>
                                                                                    <strong>Name : </strong>
                                                                                    {formdataT.formData.name}
                                                                                </span>
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    width: "40%",
                                                                                    border: "1px solid black",
                                                                                    fontFamily: "verdana,geneva,sans-serif"
                                                                                }}
                                                                                valign="center"
                                                                            >
                                                                                <span style={{ fontSize: FontSize || 11 }}>
                                                                                    <strong>Date : </strong>
                                                                                    {/* 06/03/2024 */}
                                                                                    {formdataT.formData.BookedDate}
                                                                                </span>
                                                                            </td>
                                                                        </tr>

                                                                        {/* PHONE */}
                                                                        <tr
                                                                            style={{ border: "1px solid black" }}
                                                                        >
                                                                            <td
                                                                                style={{
                                                                                    width: "50%",
                                                                                    border: "1px solid black",
                                                                                    fontFamily: "verdana,geneva,sans-serif"
                                                                                }}
                                                                                valign="center"
                                                                            >
                                                                                <span style={{ fontSize: FontSize || 11 }}>
                                                                                    <strong>Phone1 : </strong>
                                                                                    <strong> </strong>
                                                                                    {formdataT.formData.phone1}
                                                                                </span>
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    width: "50%",
                                                                                    border: "1px solid black",
                                                                                    fontFamily: "verdana,geneva,sans-serif"
                                                                                }}
                                                                                valign="center"
                                                                            >
                                                                                <span style={{
                                                                                    fontSize: FontSize || 11

                                                                                }}>
                                                                                    <strong>Phone2 : </strong>
                                                                                    <strong> </strong>
                                                                                    {formdataT.formData.phone2}
                                                                                </span>
                                                                            </td>
                                                                        </tr>


                                                                        <tr style={{ border: "1px solid black" }}>
                                                                            <td
                                                                                colSpan={2}
                                                                                style={{
                                                                                    // width: "50%",
                                                                                    border: "1px solid black",
                                                                                    fontFamily: "verdana,geneva,sans-serif"
                                                                                }}
                                                                                valign="center"
                                                                            >
                                                                                <span style={{ fontSize: FontSize || 11 }}>
                                                                                    <strong>Guest Count : </strong>
                                                                                    {formdataT.formData.GuestCountData[0] + " Adults ," + formdataT.formData.GuestCountData[1] + " Childs"}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                        <tr style={{ border: "1px solid black" }}>
                                                                            <td
                                                                                colSpan={2}
                                                                                style={{
                                                                                    border: "1px solid black",
                                                                                    fontFamily: "verdana,geneva,sans-serif"
                                                                                }}
                                                                                valign="center"
                                                                            >
                                                                                <span style={{ fontSize: FontSize || 11 }}>
                                                                                    <strong>Duration : </strong>
                                                                                    {formdataT.selectLocationData.duration[0] + " Days & "
                                                                                        + formdataT.selectLocationData.duration[1] + " Nights"}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                        <tr style={{ border: "1px solid black" }}>
                                                                            <td
                                                                                colSpan={2}
                                                                                style={{
                                                                                    border: "1px solid black",
                                                                                    fontFamily: "verdana,geneva,sans-serif"
                                                                                }}
                                                                                valign="center"
                                                                            >
                                                                                <span style={{ fontSize: FontSize || 11 }}>
                                                                                    <strong>UPI ID: </strong>
                                                                                    {formdataT.formData.upiid}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                        <tr style={{ border: "1px solid black" }}>
                                                                            <td
                                                                                colSpan={2}
                                                                                style={{
                                                                                    border: "1px solid black",
                                                                                    fontFamily: "verdana,geneva,sans-serif"
                                                                                }}
                                                                                valign="center"
                                                                            >
                                                                                <span style={{ fontSize: FontSize || 11 }}>
                                                                                    <strong>TransactionID : </strong>
                                                                                    {formdataT.formData.transactionid}
                                                                                </span>
                                                                            </td>

                                                                        </tr>
                                                                        {/* <tr style={{ border: "1px solid black" }}>
                                                        <td
                                                            colSpan={2}
                                                            style={{
                                                                border: "1px solid black",
                                                                fontFamily: "verdana,geneva,sans-serif"
                                                            }}
                                                            valign="center"
                                                        >
                                                                <span style={{ fontSize: FontSize || 11 }}>
                                                                <strong>Deposit Date: </strong>
                                                            </span>
                                                        </td>
                                                    </tr> */}
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
                                                                                                        width: "5%",
                                                                                                        border: "1px solid black",
                                                                                                        borderBottom: "0px solid black",
                                                                                                        fontFamily: "verdana,geneva,sans-serif"
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
                                                                                                        fontFamily: "verdana,geneva,sans-serif",
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
                                                                                                        fontFamily: "verdana,geneva,sans-serif",
                                                                                                        textAlign: "center"
                                                                                                    }}
                                                                                                    valign="top"
                                                                                                >
                                                                                                    <span style={{ fontSize: 12 }}>
                                                                                                        <strong>Amount (Rs)</strong>
                                                                                                    </span>
                                                                                                </td>
                                                                                            </tr>{" "}
                                                                                            <tr style={{ border: "1px solid black" }}>
                                                                                                {" "}
                                                                                                <td
                                                                                                    style={{
                                                                                                        border: "1px solid black",
                                                                                                        borderBottom: "0px solid black",
                                                                                                        fontFamily: "verdana,geneva,sans-serif"
                                                                                                    }}
                                                                                                    valign="center"
                                                                                                    align="center"
                                                                                                >
                                                                                                    <span style={{ fontSize: 14 }}> 1 </span>
                                                                                                </td>{" "}
                                                                                                <td
                                                                                                    style={{
                                                                                                        border: "1px solid black",
                                                                                                        borderBottom: "0px solid black",
                                                                                                        borderLeft: "0px solid black",
                                                                                                        fontFamily: "verdana,geneva,sans-serif",
                                                                                                        paddingLeft: "5px",
                                                                                                        paddingRight: "5px",
                                                                                                    }}
                                                                                                    valign="center"
                                                                                                >
                                                                                                    {" "}
                                                                                                    <span style={{ fontSize: 12 }}>
                                                                                                        {formdataT.selectLocationData.package_name}
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td
                                                                                                    style={{
                                                                                                        border: "1px solid black",
                                                                                                        borderLeft: "0px solid black",
                                                                                                        borderBottom: "0px solid black",
                                                                                                        fontFamily: "verdana,geneva,sans-serif",
                                                                                                        textAlign: "right"
                                                                                                    }}
                                                                                                    valign="center"
                                                                                                >
                                                                                                    <span style={{ fontSize: 12 }}>
                                                                                                        {" "}
                                                                                                        {formdataT.selectLocationData.selectedplan.Price}{" "}
                                                                                                    </span>
                                                                                                </td>
                                                                                            </tr>
                                                                                            <tr style={{ border: "1px solid black" }}>
                                                                                                {" "}
                                                                                                <td
                                                                                                    align="right"
                                                                                                    colSpan={2}
                                                                                                    style={{
                                                                                                        width: "82%",
                                                                                                        border: "1px solid black",
                                                                                                        borderBottom: "0px solid black",
                                                                                                        fontFamily: "verdana,geneva,sans-serif"
                                                                                                    }}
                                                                                                    valign="center"
                                                                                                >
                                                                                                    {" "}
                                                                                                    <span style={{ fontSize: 12 }}>
                                                                                                        <strong> Total :</strong>
                                                                                                    </span>
                                                                                                </td>{" "}
                                                                                                <td
                                                                                                    style={{
                                                                                                        width: "20%",
                                                                                                        border: "1px solid black",
                                                                                                        borderLeft: "0px solid black",
                                                                                                        borderBottom: "0px solid black",
                                                                                                        fontFamily: "verdana,geneva,sans-serif",
                                                                                                        textAlign: "right"
                                                                                                    }}
                                                                                                    valign="center"
                                                                                                >
                                                                                                    {" "}
                                                                                                    <span style={{ fontSize: 12 }}>
                                                                                                        {" "}
                                                                                                        {formdataT.selectLocationData.selectedplan.Price}{" "}
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
                                                                                                        fontFamily: "verdana,geneva,sans-serif"
                                                                                                    }}
                                                                                                    valign="center"
                                                                                                >
                                                                                                    {" "}
                                                                                                    <span style={{ fontSize: 11 }}>
                                                                                                        {" "}
                                                                                                        In Word: &nbsp;
                                                                                                        <strong>
                                                                                                            {" "}
                                                                                                            {convertNumberToWords(formdataT.selectLocationData.selectedplan.Price)}
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
                                                                        {/* <tr>
                                                        <td align="left" colSpan={2}>
                                                            <span style={{ fontSize:  FontSize || 11 }}>
                                                                <strong>Narration :</strong> &nbsp;
                                                            </span>
                                                        </td>
                                                    </tr> */}
                                                                        <tr style={{ borderBottom: "1px solid black" }}>
                                                                            <td
                                                                                align="left"
                                                                                colSpan={2}
                                                                                style={{ borderBottom: "1px solid black" }}
                                                                            >
                                                                                <p style={{ marginTop: 15 }}>&nbsp;</p>
                                                                                <p>
                                                                                    <span style={{ fontSize: FontSize || 11 }}>
                                                                                        <strong>
                                                                                            <span
                                                                                                style={{ float: "left", paddingLeft: 15 }}
                                                                                            >
                                                                                                Remarks
                                                                                            </span>
                                                                                            {/* <span
                                                                            style={{ float: "right", paddingRight: 40 }}
                                                                        >
                                                                            Cashier
                                                                        </span> */}
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
                                                                                valign="center"
                                                                            >
                                                                                <table>
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td valign="centerop" width="10%">
                                                                                                <span style={{ fontSize: FontSize || 11 }}>
                                                                                                    <strong>Note :</strong>
                                                                                                </span>
                                                                                            </td>
                                                                                            <td valign="center" width="85%">
                                                                                                <span style={{ fontSize: FontSize || 11 }}>
                                                                                                    Fees once paid will not be refunded. This
                                                                                                    receipt should be produced by the Owner
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
                            </table>


                            <div
                                style={{
                                    width: '475px',
                                    height: '40px',
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    fontWeight: '500'

                                }}>
                                <p>
                                    **Advertisement**
                                </p>
                            </div>
                            <div style={{
                                border: "2px dotted",
                                borderCollapse: "collapse",
                                width: '475px',
                                height: '170px',
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                padding: "5px",

                            }}>
                                {/* <img src="https://th.bing.com/th/id/OIP.KazWhZydZwbE_Nd3rbA0uAAAAA"
                style={{ objectFit: 'content', width: '100%', height: '150px' }}
            /> */}

                                <img
                                    src="data:image/jpeg;base64,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"
                                    style={{ objectFit: 'content', width: '100%', height: '150px' }}
                                    alt="Example"
                                />

                            </div>
                        </form>



                    </div>




                    <div className="absolute w-full h-full top-0 z-99 bg-gray-100">

                        <div className="flex flex-col items-center justify-center w-full h-full">
                            <div className="rounded-full p-5 bg-white shadow-lg animate-bounce">
                                <Spinner className="h-16 w-16 text-blue-500 animate-spin" />
                            </div>
                            <p className="text-black text-lg font-semibold animate-pulse">{"Proceesing your Bill..."}</p>
                        </div>
                    </div> 

                    {/* {/* <button onClick={downloadPdf}>Download PDF</button> */}

                </div>
                :

                <div className='absolute top-4 left-4'>
                    {"You have no access to this Page"}
                </div>

            }

        </>




    );
}

export default PdfHome;