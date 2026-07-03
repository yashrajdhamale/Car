import { React, Fragment } from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const Invoice = ({ reciept_data, location_data }) => {

    const styles = StyleSheet.create({
        page: { fontSize: 11, paddingTop: 20, paddingLeft: 40, paddingRight: 40, lineHeight: 1.5, flexDirection: 'column', display: 'flex', height: "100%", width: "100%" },
        spaceBetween: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', color: "#3E3E3E" },
        titleContainer: { flexDirection: 'row', marginTop: 24 },
        logo: { width: 90 },
        title: { fontSize: 16, textAlign: 'center' },
        invoice: { fontWeight: 'bold', fontSize: 16 },
        invoiceNumber: { fontSize: 11, fontWeight: 'bold' },
        addressTitle: { fontSize: 13, fontStyle: 'bold' },
        billing: { fontWeight: 400, fontSize: 13 },
        theader: { marginTop: 20, fontSize: 13, fontStyle: 'bold', padding: 4, flex: 1, backgroundColor: '#DEDEDE', borderColor: 'whitesmoke', borderRightWidth: 1, borderBottomWidth: 1 },
        theader2: { flex: 2, borderRightWidth: 0, borderBottomWidth: 1 },
        tbody: { fontSize: 13, paddingTop: 4, paddingLeft: 7, flex: 1, borderColor: 'whitesmoke', borderRightWidth: 1, borderBottomWidth: 1 },
        total: { fontSize: 13, paddingTop: 4, paddingLeft: 7, flex: 1.5, borderColor: 'whitesmoke', borderBottomWidth: 1, fontStyle: 'bold' },
        tbody2: { flex: 2, borderRightWidth: 1, },
        footer: { position: "absolute", bottom: "20", left: "40", fontSize: 8 }
    });

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Invoice Title  */}
                <View style={styles.titleContainer}>
                    <View style={styles.spaceBetween}>
                        {/* <Image style={styles.logo} src={"./logo.svg"} /> */}
                        <Text style={styles.title}>Travelog</Text>
                        <View>
                            <Text style={styles.invoice}>Invoice </Text>
                            <Text style={styles.invoiceNumber}>Invoice number : {reciept_data.invoice_no} </Text>
                        </View>
                    </View>
                </View>

                {/* Address */}
                <View style={styles.titleContainer}>
                    <View style={styles.spaceBetween}>
                        <View>
                            <Text style={styles.addressTitle}>Name : {reciept_data.name}</Text>
                            <Text style={styles.addressTitle}>Email : {reciept_data.email}</Text>
                        </View>
                    </View>
                    <View style={styles.spaceBetween}>
                        <View>
                            <Text style={styles.addressTitle}>Booking Date : {reciept_data.booking_date}</Text>
                            <Text style={styles.addressTitle}>Booking Id : {reciept_data.booking_id}</Text>
                        </View>
                    </View>
                </View>

                {/* UserAddress */}
                <View style={styles.titleContainer}>
                    <View style={styles.spaceBetween}>
                        <View>
                            <Text style={styles.addressTitle}>Billing Details </Text>
                            <Text style={styles.billing}>
                                UPI Id :  {reciept_data.upi_id}
                            </Text>
                            <Text style={styles.billing}>
                                Trasaction Id :  {reciept_data.transaction_id}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.titleContainer}>
                    <View style={styles.spaceBetween}>
                        <View>
                            <Text style={styles.addressTitle}>Package Details </Text>
                            <Text style={styles.billing}>
                                Package Name :  {location_data.packageName}
                            </Text>
                            {/* <Text style={styles.billing}>
                                 :  {reciept_data.transaction_id}
                            </Text> */}
                        </View>
                    </View>
                </View>

                {/* TableHead */}
                <View style={{ width: '100%', flexDirection: 'row', marginTop: 10 }}>
                    <View style={styles.theader} >
                        <Text >Package name</Text>
                    </View>
                    <View style={styles.theader}>
                        <Text>Guest Count</Text>
                    </View>
                    <View style={styles.theader}>
                        <Text>Amount</Text>
                    </View>
                </View>

                {/* TableBody */}
                {/* {reciept_data.items.map((receipt) => ( */}
                {/* <Fragment key={receipt.id}> */}
                <View style={{ width: '100%', flexDirection: 'row' }}>
                    <View style={styles.tbody}>
                        <Text >{reciept_data.holiday_name}</Text>
                    </View>
                    <View style={styles.tbody}>
                        <Text>{reciept_data.holiday_guest_count} </Text>
                    </View>
                    <View style={styles.tbody}>
                        <Text>{reciept_data.holiday_price}</Text>
                    </View>
                </View>
                {/* </Fragment> */}
                {/* ))} */}

                {/* TableTotal */}
                <View style={{ width: '100%', flexDirection: 'row' }}>
                    <View style={styles.total}>
                        <Text></Text>
                    </View>
                    <View style={styles.total}>
                        <Text> </Text>
                    </View>
                    <View style={styles.tbody}>
                        <Text>Total</Text>
                    </View>
                    <View style={styles.tbody}>
                        <Text>
                            {reciept_data.final_amount}
                        </Text>
                    </View>
                </View>

                {/* Footer */}

                <View style={styles.footer}>
                    <Text>Generated by TraveLog on - {new Date().toLocaleDateString()}</Text>
                </View>

            </Page>
        </Document>
    )
}



export default Invoice