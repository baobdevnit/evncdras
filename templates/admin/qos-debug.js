/**
 * QOS DEBUG & SIP ANALYSIS CONTROLLER - EVN CDR AS
 * Dữ liệu chuẩn hóa từ CSDL voip_cdr_20250817.sql
 * Cung cấp: Bảng dữ liệu cô đọng 7 cột, Bộ lọc cơ bản + Nâng cao, Phân trang động, Modal chi tiết 4 Khối Cards
 */

// Bộ dữ liệu thực tế trích xuất trực tiếp từ voip_cdr_20250817.sql
const QOS_CDR_DATASET = [
    {
        "id": 1,
        "Created": "2025-06-11 08:02:37",
        "Answered": "2025-06-11 08:02:40",
        "Destroyed": "2025-06-11 08:03:06",
        "Direction": "remote",
        "CallerId": 42118,
        "CallerDisplayName": "LONGNT",
        "CalledId": 42200,
        "CalledDisplayName": "",
        "SipCallId": "26183508-5060-3@BA.BGG.A.BFB",
        "CallerIp": "10.166.0.151",
        "CalledIp": "10.128.16.253",
        "DisconnectionCode": 200,
        "DisconnectionStatus": "OK",
        "ReleasedBy": "caller",
        "Answer_Delay": 2833,
        "_100_Delay": null,
        "_180_Delay": 195,
        "_183_Delay": null,
        "_180_183_Delay": 195,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_11\\\\08_03_06_591_42118_42200_26183508-5060-3@BA.BGG.A.BFB.wav",
        "Answered_Duration": 26,
        "Current_Calls_Count": 0.666667,
        "Calls_Per_Second": 0.02738,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_11\\\\08_03_06_592_42118_42200_26183508-5060-3@BA.BGG.A.BFB_sip_rtp.pcap",
        "RTP_Codec": "G711U",
        "RTP_Caller_Address": "10.166.0.151",
        "RTP_Caller_Port": 10004,
        "RTP_Caller_SSRC": 1589452753,
        "RTP_Caller_G107R": 93,
        "RTP_Caller_G107MOS": 4,
        "RTP_Caller_PacketsCount": 1427,
        "RTP_Caller_LostPackets": 0,
        "RTP_Caller_MaxRfc3550Jitter": 4,
        "RTP_Caller_MeanRfc3550Jitter": 1,
        "RTP_Caller_MaxDelta": 45,
        "RTP_Caller_MinDelta": 3,
        "RTP_Caller_PacketTime": 20,
        "RTP_Caller_NonSilentPercentage": 100,
        "RTP_Caller_Delay": 408,
        "RTP_Caller_DSCP": 48,
        "SDP_RTP_Caller_Delay": -2425,
        "RTP_Called_Address": "10.128.16.253",
        "RTP_Called_Port": 29186,
        "RTP_Called_SSRC": 1313017196,
        "RTP_Called_G107R": 93,
        "RTP_Called_G107MOS": 4,
        "RTP_Called_PacketsCount": 1432,
        "RTP_Called_LostPackets": 0,
        "RTP_Called_MaxRfc3550Jitter": 6.427407,
        "RTP_Called_MeanRfc3550Jitter": 0.138508,
        "RTP_Called_MaxDelta": 99,
        "RTP_Called_MinDelta": 7,
        "RTP_Called_PacketTime": 20,
        "RTP_Called_NonSilentPercentage": 91,
        "RTP_Called_Delay": 214,
        "RTP_Called_DSCP": 46,
        "SDP_RTP_Called_Delay": -2619,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "Khối CNTT",
        "calledGroup": "Khối CNTT"
    },
    {
        "id": 2,
        "Created": "2025-06-11 09:04:59",
        "Answered": null,
        "Destroyed": "2025-06-11 09:05:30",
        "Direction": "remote",
        "CallerId": "Anonymous",
        "CallerDisplayName": "EVNICT_DA NANG",
        "CalledId": 51716,
        "CalledDisplayName": "",
        "SipCallId": "9cac398dd40e77e1",
        "CallerIp": "10.128.16.253",
        "CalledIp": "10.8.200.80",
        "DisconnectionCode": 487,
        "DisconnectionStatus": "RequestTerminated",
        "ReleasedBy": "caller",
        "Answer_Delay": null,
        "_100_Delay": 14,
        "_180_Delay": 55,
        "_183_Delay": null,
        "_180_183_Delay": 55,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_11\\\\09_05_30_033_Anonymous_51716_9cac398dd40e77e1.wav",
        "Answered_Duration": null,
        "Current_Calls_Count": 0.666667,
        "Calls_Per_Second": 0.011813,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_11\\\\09_05_30_033_Anonymous_51716_9cac398dd40e77e1_sip_rtp.pcap",
        "RTP_Codec": "",
        "RTP_Caller_Address": null,
        "RTP_Caller_Port": null,
        "RTP_Caller_SSRC": null,
        "RTP_Caller_G107R": null,
        "RTP_Caller_G107MOS": null,
        "RTP_Caller_PacketsCount": null,
        "RTP_Caller_LostPackets": null,
        "RTP_Caller_MaxRfc3550Jitter": null,
        "RTP_Caller_MeanRfc3550Jitter": null,
        "RTP_Caller_MaxDelta": null,
        "RTP_Caller_MinDelta": null,
        "RTP_Caller_PacketTime": null,
        "RTP_Caller_NonSilentPercentage": null,
        "RTP_Caller_Delay": null,
        "RTP_Caller_DSCP": null,
        "SDP_RTP_Caller_Delay": null,
        "RTP_Called_Address": null,
        "RTP_Called_Port": null,
        "RTP_Called_SSRC": null,
        "RTP_Called_G107R": null,
        "RTP_Called_G107MOS": null,
        "RTP_Called_PacketsCount": null,
        "RTP_Called_LostPackets": null,
        "RTP_Called_MaxRfc3550Jitter": null,
        "RTP_Called_MeanRfc3550Jitter": null,
        "RTP_Called_MaxDelta": null,
        "RTP_Called_MinDelta": null,
        "RTP_Called_PacketTime": null,
        "RTP_Called_NonSilentPercentage": null,
        "RTP_Called_Delay": null,
        "RTP_Called_DSCP": null,
        "SDP_RTP_Called_Delay": null,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "EVN Cơ quan",
        "calledGroup": "EVNICT Đà Nẵng"
    },
    {
        "id": 3,
        "Created": "2025-06-11 09:15:11",
        "Answered": "2025-06-11 09:15:15",
        "Destroyed": "2025-06-11 09:15:38",
        "Direction": "remote",
        "CallerId": 96868,
        "CallerDisplayName": 96868,
        "CalledId": 45419,
        "CalledDisplayName": "",
        "SipCallId": "0_656507171@10.65.7.1",
        "CallerIp": "10.65.7.1",
        "CalledIp": "10.128.16.252",
        "DisconnectionCode": 200,
        "DisconnectionStatus": "OK",
        "ReleasedBy": "caller",
        "Answer_Delay": 4461,
        "_100_Delay": 207,
        "_180_Delay": 503,
        "_183_Delay": null,
        "_180_183_Delay": 503,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_11\\\\09_15_38_448_96868_45419_0_656507171@10.65.7.1.wav",
        "Answered_Duration": 23,
        "Current_Calls_Count": 0.333333,
        "Calls_Per_Second": 0.002494,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_11\\\\09_15_38_448_96868_45419_0_656507171@10.65.7.1_sip_rtp.pcap",
        "RTP_Codec": "G711U",
        "RTP_Caller_Address": "10.65.7.1",
        "RTP_Caller_Port": 12662,
        "RTP_Caller_SSRC": 989872051,
        "RTP_Caller_G107R": 93,
        "RTP_Caller_G107MOS": 4,
        "RTP_Caller_PacketsCount": 1325,
        "RTP_Caller_LostPackets": 0,
        "RTP_Caller_MaxRfc3550Jitter": 5,
        "RTP_Caller_MeanRfc3550Jitter": 4,
        "RTP_Caller_MaxDelta": 34,
        "RTP_Caller_MinDelta": 6,
        "RTP_Caller_PacketTime": 20,
        "RTP_Caller_NonSilentPercentage": 100,
        "RTP_Caller_Delay": 600,
        "RTP_Caller_DSCP": 1,
        "SDP_RTP_Caller_Delay": -3861,
        "RTP_Called_Address": "10.128.16.252",
        "RTP_Called_Port": 29728,
        "RTP_Called_SSRC": 949481451,
        "RTP_Called_G107R": 93,
        "RTP_Called_G107MOS": 4,
        "RTP_Called_PacketsCount": 1325,
        "RTP_Called_LostPackets": 0,
        "RTP_Called_MaxRfc3550Jitter": 0.123583,
        "RTP_Called_MeanRfc3550Jitter": 0.037439,
        "RTP_Called_MaxDelta": 21,
        "RTP_Called_MinDelta": 19,
        "RTP_Called_PacketTime": 20,
        "RTP_Called_NonSilentPercentage": 87,
        "RTP_Called_Delay": 527,
        "RTP_Called_DSCP": 46,
        "SDP_RTP_Called_Delay": -3934,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "Ban Viễn thông EVN",
        "calledGroup": "Điện lực Đà Nẵng"
    },
    {
        "id": 4,
        "Created": "2025-06-11 09:16:04",
        "Answered": "2025-06-11 09:16:08",
        "Destroyed": "2025-06-11 09:16:24",
        "Direction": "remote",
        "CallerId": 96868,
        "CallerDisplayName": "",
        "CalledId": 96800,
        "CalledDisplayName": "",
        "SipCallId": "06c3e2c28ace6f52",
        "CallerIp": "10.128.16.252",
        "CalledIp": "10.65.85.241",
        "DisconnectionCode": 200,
        "DisconnectionStatus": "OK",
        "ReleasedBy": "called",
        "Answer_Delay": 3364,
        "_100_Delay": 50,
        "_180_Delay": 75,
        "_183_Delay": null,
        "_180_183_Delay": 75,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_11\\\\09_16_24_940_96868_96800_06c3e2c28ace6f52.wav",
        "Answered_Duration": 17,
        "Current_Calls_Count": 1.666667,
        "Calls_Per_Second": 0.074846,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_11\\\\09_16_24_940_96868_96800_06c3e2c28ace6f52_sip_rtp.pcap",
        "RTP_Codec": "G711A",
        "RTP_Caller_Address": "10.128.16.252",
        "RTP_Caller_Port": 29736,
        "RTP_Caller_SSRC": 3797925804,
        "RTP_Caller_G107R": 93,
        "RTP_Caller_G107MOS": 4,
        "RTP_Caller_PacketsCount": 843,
        "RTP_Caller_LostPackets": 0,
        "RTP_Caller_MaxRfc3550Jitter": 0,
        "RTP_Caller_MeanRfc3550Jitter": 0,
        "RTP_Caller_MaxDelta": 23,
        "RTP_Caller_MinDelta": 19,
        "RTP_Caller_PacketTime": 20,
        "RTP_Caller_NonSilentPercentage": 100,
        "RTP_Caller_Delay": 3405,
        "RTP_Caller_DSCP": 46,
        "SDP_RTP_Caller_Delay": 41,
        "RTP_Called_Address": "10.65.85.241",
        "RTP_Called_Port": 12402,
        "RTP_Called_SSRC": 1367877588,
        "RTP_Called_G107R": 85,
        "RTP_Called_G107MOS": 4,
        "RTP_Called_PacketsCount": 821,
        "RTP_Called_LostPackets": 2,
        "RTP_Called_MaxRfc3550Jitter": 6.587484,
        "RTP_Called_MeanRfc3550Jitter": 4.099435,
        "RTP_Called_MaxDelta": 41,
        "RTP_Called_MinDelta": 3,
        "RTP_Called_PacketTime": 20,
        "RTP_Called_NonSilentPercentage": 100,
        "RTP_Called_Delay": 3472,
        "RTP_Called_DSCP": 1,
        "SDP_RTP_Called_Delay": 108,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "Ban Viễn thông EVN",
        "calledGroup": "Ban Viễn thông EVN"
    },
    {
        "id": 5,
        "Created": "2025-06-11 09:16:04",
        "Answered": "2025-06-11 09:16:08",
        "Destroyed": "2025-06-11 09:16:25",
        "Direction": "remote",
        "CallerId": 96868,
        "CallerDisplayName": 96868,
        "CalledId": 96800,
        "CalledDisplayName": "",
        "SipCallId": "0_656740459@10.65.7.1",
        "CallerIp": "10.65.7.1",
        "CalledIp": "10.128.16.252",
        "DisconnectionCode": 200,
        "DisconnectionStatus": "OK",
        "ReleasedBy": "caller",
        "Answer_Delay": 3591,
        "_100_Delay": 210,
        "_180_Delay": 434,
        "_183_Delay": null,
        "_180_183_Delay": 434,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_11\\\\09_16_25_686_96868_96800_0_656740459@10.65.7.1.wav",
        "Answered_Duration": 18,
        "Current_Calls_Count": 1.333333,
        "Calls_Per_Second": 0.042044,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_11\\\\09_16_25_686_96868_96800_0_656740459@10.65.7.1_sip_rtp.pcap",
        "RTP_Codec": "G711U",
        "RTP_Caller_Address": "10.65.7.1",
        "RTP_Caller_Port": 12664,
        "RTP_Caller_SSRC": 12258411,
        "RTP_Caller_G107R": 93,
        "RTP_Caller_G107MOS": 4,
        "RTP_Caller_PacketsCount": 1030,
        "RTP_Caller_LostPackets": 0,
        "RTP_Caller_MaxRfc3550Jitter": 5,
        "RTP_Caller_MeanRfc3550Jitter": 4,
        "RTP_Caller_MaxDelta": 31,
        "RTP_Caller_MinDelta": 7,
        "RTP_Caller_PacketTime": 20,
        "RTP_Caller_NonSilentPercentage": 100,
        "RTP_Caller_Delay": 518,
        "RTP_Caller_DSCP": 1,
        "SDP_RTP_Caller_Delay": -3073,
        "RTP_Called_Address": "10.128.16.252",
        "RTP_Called_Port": 29732,
        "RTP_Called_SSRC": 1898962902,
        "RTP_Called_G107R": 93,
        "RTP_Called_G107MOS": 4,
        "RTP_Called_PacketsCount": 1034,
        "RTP_Called_LostPackets": 0,
        "RTP_Called_MaxRfc3550Jitter": 0.155662,
        "RTP_Called_MeanRfc3550Jitter": 0.046772,
        "RTP_Called_MaxDelta": 21,
        "RTP_Called_MinDelta": 19,
        "RTP_Called_PacketTime": 20,
        "RTP_Called_NonSilentPercentage": 86,
        "RTP_Called_Delay": 452,
        "RTP_Called_DSCP": 46,
        "SDP_RTP_Called_Delay": -3139,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "Ban Viễn thông EVN",
        "calledGroup": "Ban Viễn thông EVN"
    },
    {
        "id": 6,
        "Created": "2025-06-11 09:16:45",
        "Answered": null,
        "Destroyed": "2025-06-11 09:16:46",
        "Direction": "remote",
        "CallerId": 96800,
        "CallerDisplayName": 96800,
        "CalledId": 96868,
        "CalledDisplayName": "",
        "SipCallId": "0_751158790@10.65.85.241",
        "CallerIp": "10.65.85.241",
        "CalledIp": "10.128.16.252",
        "DisconnectionCode": 487,
        "DisconnectionStatus": "RequestTerminated",
        "ReleasedBy": "caller",
        "Answer_Delay": null,
        "_100_Delay": 203,
        "_180_Delay": 333,
        "_183_Delay": null,
        "_180_183_Delay": 333,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_11\\\\09_16_46_948_96800_96868_0_751158790@10.65.85.241.wav",
        "Answered_Duration": null,
        "Current_Calls_Count": 1,
        "Calls_Per_Second": 0.08864,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_11\\\\09_16_46_948_96800_96868_0_751158790@10.65.85.241_sip_rtp.pcap",
        "RTP_Codec": "G711U",
        "RTP_Caller_Address": "10.65.85.241",
        "RTP_Caller_Port": 12404,
        "RTP_Caller_SSRC": 736980369,
        "RTP_Caller_G107R": 93,
        "RTP_Caller_G107MOS": 4,
        "RTP_Caller_PacketsCount": 72,
        "RTP_Caller_LostPackets": 0,
        "RTP_Caller_MaxRfc3550Jitter": 5,
        "RTP_Caller_MeanRfc3550Jitter": 4,
        "RTP_Caller_MaxDelta": 31,
        "RTP_Caller_MinDelta": 10,
        "RTP_Caller_PacketTime": 20,
        "RTP_Caller_NonSilentPercentage": 56,
        "RTP_Caller_Delay": 445,
        "RTP_Caller_DSCP": 1,
        "SDP_RTP_Caller_Delay": null,
        "RTP_Called_Address": "10.128.16.252",
        "RTP_Called_Port": 29740,
        "RTP_Called_SSRC": 3300884312,
        "RTP_Called_G107R": 93,
        "RTP_Called_G107MOS": 4,
        "RTP_Called_PacketsCount": 77,
        "RTP_Called_LostPackets": 0,
        "RTP_Called_MaxRfc3550Jitter": 0.074067,
        "RTP_Called_MeanRfc3550Jitter": 0.046598,
        "RTP_Called_MaxDelta": 20,
        "RTP_Called_MinDelta": 20,
        "RTP_Called_PacketTime": 20,
        "RTP_Called_NonSilentPercentage": 3,
        "RTP_Called_Delay": 350,
        "RTP_Called_DSCP": 46,
        "SDP_RTP_Called_Delay": null,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "Ban Viễn thông EVN",
        "calledGroup": "Ban Viễn thông EVN"
    },
    {
        "id": 7,
        "Created": "2025-06-11 09:16:45",
        "Answered": null,
        "Destroyed": "2025-06-11 09:16:47",
        "Direction": "remote",
        "CallerId": 96800,
        "CallerDisplayName": "",
        "CalledId": 96868,
        "CalledDisplayName": "",
        "SipCallId": "758360f05580f59c",
        "CallerIp": "10.128.16.252",
        "CalledIp": "10.65.7.1",
        "DisconnectionCode": 487,
        "DisconnectionStatus": "RequestTerminated",
        "ReleasedBy": "caller",
        "Answer_Delay": null,
        "_100_Delay": 35,
        "_180_Delay": 57,
        "_183_Delay": null,
        "_180_183_Delay": 57,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_11\\\\09_16_47_058_96800_96868_758360f05580f59c.wav",
        "Answered_Duration": null,
        "Current_Calls_Count": 1,
        "Calls_Per_Second": 0.08864,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_11\\\\09_16_47_058_96800_96868_758360f05580f59c_sip_rtp.pcap",
        "RTP_Codec": "",
        "RTP_Caller_Address": null,
        "RTP_Caller_Port": null,
        "RTP_Caller_SSRC": null,
        "RTP_Caller_G107R": null,
        "RTP_Caller_G107MOS": null,
        "RTP_Caller_PacketsCount": null,
        "RTP_Caller_LostPackets": null,
        "RTP_Caller_MaxRfc3550Jitter": null,
        "RTP_Caller_MeanRfc3550Jitter": null,
        "RTP_Caller_MaxDelta": null,
        "RTP_Caller_MinDelta": null,
        "RTP_Caller_PacketTime": null,
        "RTP_Caller_NonSilentPercentage": null,
        "RTP_Caller_Delay": null,
        "RTP_Caller_DSCP": null,
        "SDP_RTP_Caller_Delay": null,
        "RTP_Called_Address": null,
        "RTP_Called_Port": null,
        "RTP_Called_SSRC": null,
        "RTP_Called_G107R": null,
        "RTP_Called_G107MOS": null,
        "RTP_Called_PacketsCount": null,
        "RTP_Called_LostPackets": null,
        "RTP_Called_MaxRfc3550Jitter": null,
        "RTP_Called_MeanRfc3550Jitter": null,
        "RTP_Called_MaxDelta": null,
        "RTP_Called_MinDelta": null,
        "RTP_Called_PacketTime": null,
        "RTP_Called_NonSilentPercentage": null,
        "RTP_Called_Delay": null,
        "RTP_Called_DSCP": null,
        "SDP_RTP_Called_Delay": null,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "Ban Viễn thông EVN",
        "calledGroup": "Ban Viễn thông EVN"
    },
    {
        "id": 8,
        "Created": "2025-06-11 09:22:20",
        "Answered": "2025-06-11 09:22:41",
        "Destroyed": "2025-06-11 09:23:08",
        "Direction": "remote",
        "CallerId": 96868,
        "CallerDisplayName": "",
        "CalledId": 96800,
        "CalledDisplayName": "",
        "SipCallId": "0636c8e9c7f6d414",
        "CallerIp": "10.128.16.252",
        "CalledIp": "10.65.85.241",
        "DisconnectionCode": 200,
        "DisconnectionStatus": "OK",
        "ReleasedBy": "called",
        "Answer_Delay": 20245,
        "_100_Delay": 50,
        "_180_Delay": 76,
        "_183_Delay": null,
        "_180_183_Delay": 76,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_11\\\\09_23_08_188_96868_96800_0636c8e9c7f6d414.wav",
        "Answered_Duration": 27,
        "Current_Calls_Count": 1.333333,
        "Calls_Per_Second": 0.008831,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_11\\\\09_23_08_188_96868_96800_0636c8e9c7f6d414_sip_rtp.pcap",
        "RTP_Codec": "G711A",
        "RTP_Caller_Address": "10.128.16.252",
        "RTP_Caller_Port": 29752,
        "RTP_Caller_SSRC": 318635362,
        "RTP_Caller_G107R": 93,
        "RTP_Caller_G107MOS": 4,
        "RTP_Caller_PacketsCount": 1355,
        "RTP_Caller_LostPackets": 0,
        "RTP_Caller_MaxRfc3550Jitter": 0,
        "RTP_Caller_MeanRfc3550Jitter": 0,
        "RTP_Caller_MaxDelta": 21,
        "RTP_Caller_MinDelta": 17,
        "RTP_Caller_PacketTime": 20,
        "RTP_Caller_NonSilentPercentage": 100,
        "RTP_Caller_Delay": 20281,
        "RTP_Caller_DSCP": 46,
        "SDP_RTP_Caller_Delay": 36,
        "RTP_Called_Address": "10.65.85.241",
        "RTP_Called_Port": 12406,
        "RTP_Called_SSRC": 1307600691,
        "RTP_Called_G107R": 88,
        "RTP_Called_G107MOS": 4,
        "RTP_Called_PacketsCount": 1332,
        "RTP_Called_LostPackets": 1,
        "RTP_Called_MaxRfc3550Jitter": 7.463265,
        "RTP_Called_MeanRfc3550Jitter": 3.904666,
        "RTP_Called_MaxDelta": 48,
        "RTP_Called_MinDelta": 2,
        "RTP_Called_PacketTime": 20,
        "RTP_Called_NonSilentPercentage": 100,
        "RTP_Called_Delay": 20353,
        "RTP_Called_DSCP": 1,
        "SDP_RTP_Called_Delay": 108,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "Ban Viễn thông EVN",
        "calledGroup": "Ban Viễn thông EVN"
    },
    {
        "id": 9,
        "Created": "2025-06-11 09:22:20",
        "Answered": "2025-06-11 09:22:41",
        "Destroyed": "2025-06-11 09:23:09",
        "Direction": "remote",
        "CallerId": 96868,
        "CallerDisplayName": 96868,
        "CalledId": 96800,
        "CalledDisplayName": "",
        "SipCallId": "0_657093942@10.65.7.1",
        "CallerIp": "10.65.7.1",
        "CalledIp": "10.128.16.252",
        "DisconnectionCode": 200,
        "DisconnectionStatus": "OK",
        "ReleasedBy": "called",
        "Answer_Delay": 20577,
        "_100_Delay": 200,
        "_180_Delay": 380,
        "_183_Delay": null,
        "_180_183_Delay": 380,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_11\\\\09_23_09_259_96868_96800_0_657093942@10.65.7.1.wav",
        "Answered_Duration": 28,
        "Current_Calls_Count": 1,
        "Calls_Per_Second": 0.008772,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_11\\\\09_23_09_259_96868_96800_0_657093942@10.65.7.1_sip_rtp.pcap",
        "RTP_Codec": "G711U",
        "RTP_Caller_Address": "10.65.7.1",
        "RTP_Caller_Port": 12668,
        "RTP_Caller_SSRC": 51078064,
        "RTP_Caller_G107R": 92,
        "RTP_Caller_G107MOS": 4,
        "RTP_Caller_PacketsCount": 2399,
        "RTP_Caller_LostPackets": 0,
        "RTP_Caller_MaxRfc3550Jitter": 7,
        "RTP_Caller_MeanRfc3550Jitter": 4,
        "RTP_Caller_MaxDelta": 62,
        "RTP_Caller_MinDelta": 1,
        "RTP_Caller_PacketTime": 20,
        "RTP_Caller_NonSilentPercentage": 100,
        "RTP_Caller_Delay": 462,
        "RTP_Caller_DSCP": 1,
        "SDP_RTP_Caller_Delay": -20115,
        "RTP_Called_Address": "10.128.16.252",
        "RTP_Called_Port": 29748,
        "RTP_Called_SSRC": 2306801329,
        "RTP_Called_G107R": 93,
        "RTP_Called_G107MOS": 4,
        "RTP_Called_PacketsCount": 2412,
        "RTP_Called_LostPackets": 0,
        "RTP_Called_MaxRfc3550Jitter": 0.146853,
        "RTP_Called_MeanRfc3550Jitter": 0.072231,
        "RTP_Called_MaxDelta": 21,
        "RTP_Called_MinDelta": 19,
        "RTP_Called_PacketTime": 20,
        "RTP_Called_NonSilentPercentage": 66,
        "RTP_Called_Delay": 407,
        "RTP_Called_DSCP": 46,
        "SDP_RTP_Called_Delay": -20170,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "Ban Viễn thông EVN",
        "calledGroup": "Ban Viễn thông EVN"
    },
    {
        "id": 15,
        "Created": "2025-06-11 09:33:34",
        "Answered": "2025-06-11 09:33:36",
        "Destroyed": "2025-06-11 09:33:41",
        "Direction": "remote",
        "CallerId": 96868,
        "CallerDisplayName": "",
        "CalledId": 96800,
        "CalledDisplayName": "",
        "SipCallId": "5b2072f4b91681e4",
        "CallerIp": "10.128.16.252",
        "CalledIp": "10.65.85.241",
        "DisconnectionCode": 200,
        "DisconnectionStatus": "OK",
        "ReleasedBy": "caller",
        "Answer_Delay": 1768,
        "_100_Delay": 50,
        "_180_Delay": 76,
        "_183_Delay": null,
        "_180_183_Delay": 76,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_11\\\\09_33_41_116_96868_96800_5b2072f4b91681e4.wav",
        "Answered_Duration": 4,
        "Current_Calls_Count": 0.5,
        "Calls_Per_Second": 0.103761,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_11\\\\09_33_41_116_96868_96800_5b2072f4b91681e4_sip_rtp.pcap",
        "RTP_Codec": "G711A",
        "RTP_Caller_Address": "10.128.16.252",
        "RTP_Caller_Port": 29776,
        "RTP_Caller_SSRC": 1606396996,
        "RTP_Caller_G107R": 93,
        "RTP_Caller_G107MOS": 4,
        "RTP_Caller_PacketsCount": 219,
        "RTP_Caller_LostPackets": 0,
        "RTP_Caller_MaxRfc3550Jitter": 0,
        "RTP_Caller_MeanRfc3550Jitter": 0,
        "RTP_Caller_MaxDelta": 21,
        "RTP_Caller_MinDelta": 20,
        "RTP_Caller_PacketTime": 20,
        "RTP_Caller_NonSilentPercentage": 93,
        "RTP_Caller_Delay": 1805,
        "RTP_Caller_DSCP": 46,
        "SDP_RTP_Caller_Delay": 37,
        "RTP_Called_Address": "10.65.85.241",
        "RTP_Called_Port": 12410,
        "RTP_Called_SSRC": 32505911,
        "RTP_Called_G107R": 92,
        "RTP_Called_G107MOS": 4,
        "RTP_Called_PacketsCount": 215,
        "RTP_Called_LostPackets": 0,
        "RTP_Called_MaxRfc3550Jitter": 4.621384,
        "RTP_Called_MeanRfc3550Jitter": 3.864656,
        "RTP_Called_MaxDelta": 40,
        "RTP_Called_MinDelta": 14,
        "RTP_Called_PacketTime": 20,
        "RTP_Called_NonSilentPercentage": 100,
        "RTP_Called_Delay": 1872,
        "RTP_Called_DSCP": 1,
        "SDP_RTP_Called_Delay": 104,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "Ban Viễn thông EVN",
        "calledGroup": "Ban Viễn thông EVN"
    },
    {
        "id": 28,
        "Created": "2025-06-11 10:34:30",
        "Answered": null,
        "Destroyed": "2025-06-11 10:34:30",
        "Direction": "remote",
        "CallerId": "",
        "CallerDisplayName": "",
        "CalledId": 0,
        "CalledDisplayName": "",
        "SipCallId": "16_658461520@10.65.7.1",
        "CallerIp": "10.65.7.1",
        "CalledIp": "10.128.16.252",
        "DisconnectionCode": 503,
        "DisconnectionStatus": "ServiceUnavailable",
        "ReleasedBy": "called",
        "Answer_Delay": null,
        "_100_Delay": null,
        "_180_Delay": null,
        "_183_Delay": null,
        "_180_183_Delay": null,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_11\\\\10_34_30_999__0_16_658461520@10.65.7.1.wav",
        "Answered_Duration": null,
        "Current_Calls_Count": 0,
        "Calls_Per_Second": 0,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_11\\\\10_34_30_999__0_16_658461520@10.65.7.1_sip_rtp.pcap",
        "RTP_Codec": "",
        "RTP_Caller_Address": null,
        "RTP_Caller_Port": null,
        "RTP_Caller_SSRC": null,
        "RTP_Caller_G107R": null,
        "RTP_Caller_G107MOS": null,
        "RTP_Caller_PacketsCount": null,
        "RTP_Caller_LostPackets": null,
        "RTP_Caller_MaxRfc3550Jitter": null,
        "RTP_Caller_MeanRfc3550Jitter": null,
        "RTP_Caller_MaxDelta": null,
        "RTP_Caller_MinDelta": null,
        "RTP_Caller_PacketTime": null,
        "RTP_Caller_NonSilentPercentage": null,
        "RTP_Caller_Delay": null,
        "RTP_Caller_DSCP": null,
        "SDP_RTP_Caller_Delay": null,
        "RTP_Called_Address": null,
        "RTP_Called_Port": null,
        "RTP_Called_SSRC": null,
        "RTP_Called_G107R": null,
        "RTP_Called_G107MOS": null,
        "RTP_Called_PacketsCount": null,
        "RTP_Called_LostPackets": null,
        "RTP_Called_MaxRfc3550Jitter": null,
        "RTP_Called_MeanRfc3550Jitter": null,
        "RTP_Called_MaxDelta": null,
        "RTP_Called_MinDelta": null,
        "RTP_Called_PacketTime": null,
        "RTP_Called_NonSilentPercentage": null,
        "RTP_Called_Delay": null,
        "RTP_Called_DSCP": null,
        "SDP_RTP_Called_Delay": null,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": null,
        "calledGroup": null
    },
    {
        "id": 35,
        "Created": "2025-06-11 16:42:18",
        "Answered": "2025-06-11 16:42:41",
        "Destroyed": "2025-06-11 16:43:04",
        "Direction": "remote",
        "CallerId": 51798,
        "CallerDisplayName": "",
        "CalledId": 51732,
        "CalledDisplayName": "",
        "SipCallId": "bf016f58562e2d41",
        "CallerIp": "10.128.16.253",
        "CalledIp": "10.8.205.150",
        "DisconnectionCode": 200,
        "DisconnectionStatus": "OK",
        "ReleasedBy": "called",
        "Answer_Delay": 23103,
        "_100_Delay": 13,
        "_180_Delay": 52,
        "_183_Delay": null,
        "_180_183_Delay": 52,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_11\\\\16_43_04_426_51798_51732_bf016f58562e2d41.wav",
        "Answered_Duration": 23,
        "Current_Calls_Count": 1.5,
        "Calls_Per_Second": 0.052058,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_11\\\\16_43_04_426_51798_51732_bf016f58562e2d41_sip_rtp.pcap",
        "RTP_Codec": "G711A",
        "RTP_Caller_Address": "10.128.16.253",
        "RTP_Caller_Port": 29222,
        "RTP_Caller_SSRC": 1124953131,
        "RTP_Caller_G107R": 93,
        "RTP_Caller_G107MOS": 4,
        "RTP_Caller_PacketsCount": 1136,
        "RTP_Caller_LostPackets": 0,
        "RTP_Caller_MaxRfc3550Jitter": 1,
        "RTP_Caller_MeanRfc3550Jitter": 0,
        "RTP_Caller_MaxDelta": 43,
        "RTP_Caller_MinDelta": 14,
        "RTP_Caller_PacketTime": 20,
        "RTP_Caller_NonSilentPercentage": 100,
        "RTP_Caller_Delay": 23128,
        "RTP_Caller_DSCP": 46,
        "SDP_RTP_Caller_Delay": 25,
        "RTP_Called_Address": "10.8.205.150",
        "RTP_Called_Port": 8002,
        "RTP_Called_SSRC": 3369771688,
        "RTP_Called_G107R": 93,
        "RTP_Called_G107MOS": 4,
        "RTP_Called_PacketsCount": 1134,
        "RTP_Called_LostPackets": 0,
        "RTP_Called_MaxRfc3550Jitter": 3.365824,
        "RTP_Called_MeanRfc3550Jitter": 0.200988,
        "RTP_Called_MaxDelta": 36,
        "RTP_Called_MinDelta": 5,
        "RTP_Called_PacketTime": 20,
        "RTP_Called_NonSilentPercentage": 98,
        "RTP_Called_Delay": 23151,
        "RTP_Called_DSCP": 1,
        "SDP_RTP_Called_Delay": 48,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "EVNICT Đà Nẵng",
        "calledGroup": "EVNICT Đà Nẵng"
    },
    {
        "id": 38,
        "Created": "2025-06-12 07:50:25",
        "Answered": "2025-06-12 07:50:29",
        "Destroyed": "2025-06-12 07:51:13",
        "Direction": "remote",
        "CallerId": 51771,
        "CallerDisplayName": "",
        "CalledId": 51710,
        "CalledDisplayName": "",
        "SipCallId": "7d15b984a843464f",
        "CallerIp": "10.128.16.253",
        "CalledIp": "10.8.200.74",
        "DisconnectionCode": 200,
        "DisconnectionStatus": "OK",
        "ReleasedBy": "called",
        "Answer_Delay": 3129,
        "_100_Delay": 13,
        "_180_Delay": 37,
        "_183_Delay": null,
        "_180_183_Delay": 37,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_12\\\\07_51_13_484_51771_51710_7d15b984a843464f.wav",
        "Answered_Duration": 44,
        "Current_Calls_Count": 1.5,
        "Calls_Per_Second": 0.027055,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_12\\\\07_51_13_484_51771_51710_7d15b984a843464f_sip_rtp.pcap",
        "RTP_Codec": "G711A",
        "RTP_Caller_Address": "10.128.16.253",
        "RTP_Caller_Port": 29230,
        "RTP_Caller_SSRC": 204845229,
        "RTP_Caller_G107R": 93,
        "RTP_Caller_G107MOS": 4,
        "RTP_Caller_PacketsCount": 2216,
        "RTP_Caller_LostPackets": 0,
        "RTP_Caller_MaxRfc3550Jitter": 2,
        "RTP_Caller_MeanRfc3550Jitter": 0,
        "RTP_Caller_MaxDelta": 47,
        "RTP_Caller_MinDelta": 16,
        "RTP_Caller_PacketTime": 20,
        "RTP_Caller_NonSilentPercentage": 100,
        "RTP_Caller_Delay": 3151,
        "RTP_Caller_DSCP": 46,
        "SDP_RTP_Caller_Delay": 22,
        "RTP_Called_Address": "10.8.200.74",
        "RTP_Called_Port": 12284,
        "RTP_Called_SSRC": 1007627480,
        "RTP_Called_G107R": 93,
        "RTP_Called_G107MOS": 4,
        "RTP_Called_PacketsCount": 2209,
        "RTP_Called_LostPackets": 0,
        "RTP_Called_MaxRfc3550Jitter": 4.962325,
        "RTP_Called_MeanRfc3550Jitter": 1.338257,
        "RTP_Called_MaxDelta": 33,
        "RTP_Called_MinDelta": 1,
        "RTP_Called_PacketTime": 20,
        "RTP_Called_NonSilentPercentage": 100,
        "RTP_Called_Delay": 3316,
        "RTP_Called_DSCP": 1,
        "SDP_RTP_Called_Delay": 187,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "EVNICT Đà Nẵng",
        "calledGroup": "EVNICT Đà Nẵng"
    },
    {
        "id": 46,
        "Created": "2025-06-12 08:11:56",
        "Answered": "2025-06-12 08:12:03",
        "Destroyed": "2025-06-12 08:12:14",
        "Direction": "remote",
        "CallerId": 96868,
        "CallerDisplayName": "",
        "CalledId": 96801,
        "CalledDisplayName": "",
        "SipCallId": "535a66be3f984a99",
        "CallerIp": "10.128.16.252",
        "CalledIp": "10.65.57.10",
        "DisconnectionCode": 200,
        "DisconnectionStatus": "OK",
        "ReleasedBy": "called",
        "Answer_Delay": 7010,
        "_100_Delay": 38,
        "_180_Delay": null,
        "_183_Delay": null,
        "_180_183_Delay": null,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_12\\\\08_12_14_697_96868_96801_535a66be3f984a99.wav",
        "Answered_Duration": 11,
        "Current_Calls_Count": 1.333333,
        "Calls_Per_Second": 0.056259,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_12\\\\08_12_14_697_96868_96801_535a66be3f984a99_sip_rtp.pcap",
        "RTP_Codec": "G711A",
        "RTP_Caller_Address": "10.128.16.252",
        "RTP_Caller_Port": 29860,
        "RTP_Caller_SSRC": 2970723702,
        "RTP_Caller_G107R": 93,
        "RTP_Caller_G107MOS": 4,
        "RTP_Caller_PacketsCount": 537,
        "RTP_Caller_LostPackets": 0,
        "RTP_Caller_MaxRfc3550Jitter": 0,
        "RTP_Caller_MeanRfc3550Jitter": 0,
        "RTP_Caller_MaxDelta": 25,
        "RTP_Caller_MinDelta": 19,
        "RTP_Caller_PacketTime": 20,
        "RTP_Caller_NonSilentPercentage": 99,
        "RTP_Caller_Delay": 7052,
        "RTP_Caller_DSCP": 46,
        "SDP_RTP_Caller_Delay": 42,
        "RTP_Called_Address": "10.65.57.10",
        "RTP_Called_Port": 12270,
        "RTP_Called_SSRC": 344478077,
        "RTP_Called_G107R": 49,
        "RTP_Called_G107MOS": 3,
        "RTP_Called_PacketsCount": 402,
        "RTP_Called_LostPackets": 25,
        "RTP_Called_MaxRfc3550Jitter": 3.81518,
        "RTP_Called_MeanRfc3550Jitter": 2.753338,
        "RTP_Called_MaxDelta": 120,
        "RTP_Called_MinDelta": 13,
        "RTP_Called_PacketTime": 20,
        "RTP_Called_NonSilentPercentage": 100,
        "RTP_Called_Delay": 7103,
        "RTP_Called_DSCP": 1,
        "SDP_RTP_Called_Delay": 93,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "Ban Viễn thông EVN",
        "calledGroup": "Ban Viễn thông EVN"
    },
    {
        "id": 63,
        "Created": "2025-06-12 08:22:05",
        "Answered": null,
        "Destroyed": null,
        "Direction": "remote",
        "CallerId": 96868,
        "CallerDisplayName": "",
        "CalledId": 96808,
        "CalledDisplayName": "",
        "SipCallId": "85e191fa03bb1906",
        "CallerIp": "10.128.16.252",
        "CalledIp": "10.65.56.10",
        "DisconnectionCode": 408,
        "DisconnectionStatus": "RequestTimeout",
        "ReleasedBy": "called",
        "Answer_Delay": null,
        "_100_Delay": null,
        "_180_Delay": null,
        "_183_Delay": null,
        "_180_183_Delay": null,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_12\\\\08_22_38_978_96868_96808_85e191fa03bb1906.wav",
        "Answered_Duration": null,
        "Current_Calls_Count": 1.333333,
        "Calls_Per_Second": 0.035863,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": null,
        "RTP_Codec": "",
        "RTP_Caller_Address": null,
        "RTP_Caller_Port": null,
        "RTP_Caller_SSRC": null,
        "RTP_Caller_G107R": null,
        "RTP_Caller_G107MOS": null,
        "RTP_Caller_PacketsCount": null,
        "RTP_Caller_LostPackets": null,
        "RTP_Caller_MaxRfc3550Jitter": null,
        "RTP_Caller_MeanRfc3550Jitter": null,
        "RTP_Caller_MaxDelta": null,
        "RTP_Caller_MinDelta": null,
        "RTP_Caller_PacketTime": null,
        "RTP_Caller_NonSilentPercentage": null,
        "RTP_Caller_Delay": null,
        "RTP_Caller_DSCP": null,
        "SDP_RTP_Caller_Delay": null,
        "RTP_Called_Address": null,
        "RTP_Called_Port": null,
        "RTP_Called_SSRC": null,
        "RTP_Called_G107R": null,
        "RTP_Called_G107MOS": null,
        "RTP_Called_PacketsCount": null,
        "RTP_Called_LostPackets": null,
        "RTP_Called_MaxRfc3550Jitter": null,
        "RTP_Called_MeanRfc3550Jitter": null,
        "RTP_Called_MaxDelta": null,
        "RTP_Called_MinDelta": null,
        "RTP_Called_PacketTime": null,
        "RTP_Called_NonSilentPercentage": null,
        "RTP_Called_Delay": null,
        "RTP_Called_DSCP": null,
        "SDP_RTP_Called_Delay": null,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "Ban Viễn thông EVN",
        "calledGroup": "Ban Viễn thông EVN"
    },
    {
        "id": 201,
        "Created": "2025-06-12 14:45:31",
        "Answered": null,
        "Destroyed": "2025-06-12 14:45:31",
        "Direction": "remote",
        "CallerId": 51798,
        "CallerDisplayName": "",
        "CalledId": 51732,
        "CalledDisplayName": "",
        "SipCallId": "2d46cb2e837d7dce",
        "CallerIp": "10.128.16.253",
        "CalledIp": "10.8.205.150",
        "DisconnectionCode": 486,
        "DisconnectionStatus": "BusyHere",
        "ReleasedBy": "called",
        "Answer_Delay": null,
        "_100_Delay": 14,
        "_180_Delay": null,
        "_183_Delay": null,
        "_180_183_Delay": null,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_12\\\\14_45_31_924_51798_51732_2d46cb2e837d7dce.wav",
        "Answered_Duration": null,
        "Current_Calls_Count": 0,
        "Calls_Per_Second": 0.00315,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_12\\\\14_45_31_924_51798_51732_2d46cb2e837d7dce_sip_rtp.pcap",
        "RTP_Codec": "",
        "RTP_Caller_Address": null,
        "RTP_Caller_Port": null,
        "RTP_Caller_SSRC": null,
        "RTP_Caller_G107R": null,
        "RTP_Caller_G107MOS": null,
        "RTP_Caller_PacketsCount": null,
        "RTP_Caller_LostPackets": null,
        "RTP_Caller_MaxRfc3550Jitter": null,
        "RTP_Caller_MeanRfc3550Jitter": null,
        "RTP_Caller_MaxDelta": null,
        "RTP_Caller_MinDelta": null,
        "RTP_Caller_PacketTime": null,
        "RTP_Caller_NonSilentPercentage": null,
        "RTP_Caller_Delay": null,
        "RTP_Caller_DSCP": null,
        "SDP_RTP_Caller_Delay": null,
        "RTP_Called_Address": null,
        "RTP_Called_Port": null,
        "RTP_Called_SSRC": null,
        "RTP_Called_G107R": null,
        "RTP_Called_G107MOS": null,
        "RTP_Called_PacketsCount": null,
        "RTP_Called_LostPackets": null,
        "RTP_Called_MaxRfc3550Jitter": null,
        "RTP_Called_MeanRfc3550Jitter": null,
        "RTP_Called_MaxDelta": null,
        "RTP_Called_MinDelta": null,
        "RTP_Called_PacketTime": null,
        "RTP_Called_NonSilentPercentage": null,
        "RTP_Called_Delay": null,
        "RTP_Called_DSCP": null,
        "SDP_RTP_Called_Delay": null,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "EVNICT Đà Nẵng",
        "calledGroup": "EVNICT Đà Nẵng"
    },
    {
        "id": 202,
        "Created": "2025-06-12 14:45:31",
        "Answered": null,
        "Destroyed": "2025-06-12 14:45:32",
        "Direction": "remote",
        "CallerId": 51798,
        "CallerDisplayName": "QADS_51798",
        "CalledId": 51732,
        "CalledDisplayName": "",
        "SipCallId": "0_772471973@10.8.201.14",
        "CallerIp": "10.8.201.14",
        "CalledIp": "10.128.16.253",
        "DisconnectionCode": 486,
        "DisconnectionStatus": "BusyHere",
        "ReleasedBy": "called",
        "Answer_Delay": null,
        "_100_Delay": 200,
        "_180_Delay": null,
        "_183_Delay": null,
        "_180_183_Delay": null,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_12\\\\14_45_32_950_51798_51732_0_772471973@10.8.201.14.wav",
        "Answered_Duration": null,
        "Current_Calls_Count": 0.5,
        "Calls_Per_Second": 0.095087,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_12\\\\14_45_32_950_51798_51732_0_772471973@10.8.201.14_sip_rtp.pcap",
        "RTP_Codec": "",
        "RTP_Caller_Address": null,
        "RTP_Caller_Port": null,
        "RTP_Caller_SSRC": null,
        "RTP_Caller_G107R": null,
        "RTP_Caller_G107MOS": null,
        "RTP_Caller_PacketsCount": null,
        "RTP_Caller_LostPackets": null,
        "RTP_Caller_MaxRfc3550Jitter": null,
        "RTP_Caller_MeanRfc3550Jitter": null,
        "RTP_Caller_MaxDelta": null,
        "RTP_Caller_MinDelta": null,
        "RTP_Caller_PacketTime": null,
        "RTP_Caller_NonSilentPercentage": null,
        "RTP_Caller_Delay": null,
        "RTP_Caller_DSCP": null,
        "SDP_RTP_Caller_Delay": null,
        "RTP_Called_Address": null,
        "RTP_Called_Port": null,
        "RTP_Called_SSRC": null,
        "RTP_Called_G107R": null,
        "RTP_Called_G107MOS": null,
        "RTP_Called_PacketsCount": null,
        "RTP_Called_LostPackets": null,
        "RTP_Called_MaxRfc3550Jitter": null,
        "RTP_Called_MeanRfc3550Jitter": null,
        "RTP_Called_MaxDelta": null,
        "RTP_Called_MinDelta": null,
        "RTP_Called_PacketTime": null,
        "RTP_Called_NonSilentPercentage": null,
        "RTP_Called_Delay": null,
        "RTP_Called_DSCP": null,
        "SDP_RTP_Called_Delay": null,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "EVNICT Đà Nẵng",
        "calledGroup": "EVNICT Đà Nẵng"
    },
    {
        "id": 339,
        "Created": "2025-06-16 11:03:33",
        "Answered": null,
        "Destroyed": "2025-06-16 11:03:33",
        "Direction": "remote",
        "CallerId": 42118,
        "CallerDisplayName": "LONGNT",
        "CalledId": 62853,
        "CalledDisplayName": "",
        "SipCallId": "54742524-5060-3@BA.BGG.A.BFB",
        "CallerIp": "10.166.0.151",
        "CalledIp": "10.128.16.253",
        "DisconnectionCode": 503,
        "DisconnectionStatus": "ServiceUnavailable",
        "ReleasedBy": "called",
        "Answer_Delay": null,
        "_100_Delay": null,
        "_180_Delay": null,
        "_183_Delay": null,
        "_180_183_Delay": null,
        "Audio_Signal_Delay": null,
        "Latest_RBT_Delay": null,
        "Early_Media_Peak_Signal_Level": null,
        "Active_Media_Peak_Signal_Level": null,
        "Recorded_RX_FileName": null,
        "Recorded_TX_FileName": null,
        "Recorded_Mix_FileName": "D:\\\\StarTrinity\\\\recordings\\\\2025_06_16\\\\11_03_33_197_42118_62853_54742524-5060-3@BA.BGG.A.BFB.wav",
        "Answered_Duration": null,
        "Current_Calls_Count": 0,
        "Calls_Per_Second": 0,
        "Sip_Pcap_FileName": null,
        "Sip_And_Rtp_Pcap_FileName": "D:\\\\StarTrinity\\\\pcap\\\\2025_06_16\\\\11_03_33_197_42118_62853_54742524-5060-3@BA.BGG.A.BFB_sip_rtp.pcap",
        "RTP_Codec": "",
        "RTP_Caller_Address": null,
        "RTP_Caller_Port": null,
        "RTP_Caller_SSRC": null,
        "RTP_Caller_G107R": null,
        "RTP_Caller_G107MOS": null,
        "RTP_Caller_PacketsCount": null,
        "RTP_Caller_LostPackets": null,
        "RTP_Caller_MaxRfc3550Jitter": null,
        "RTP_Caller_MeanRfc3550Jitter": null,
        "RTP_Caller_MaxDelta": null,
        "RTP_Caller_MinDelta": null,
        "RTP_Caller_PacketTime": null,
        "RTP_Caller_NonSilentPercentage": null,
        "RTP_Caller_Delay": null,
        "RTP_Caller_DSCP": null,
        "SDP_RTP_Caller_Delay": null,
        "RTP_Called_Address": null,
        "RTP_Called_Port": null,
        "RTP_Called_SSRC": null,
        "RTP_Called_G107R": null,
        "RTP_Called_G107MOS": null,
        "RTP_Called_PacketsCount": null,
        "RTP_Called_LostPackets": null,
        "RTP_Called_MaxRfc3550Jitter": null,
        "RTP_Called_MeanRfc3550Jitter": null,
        "RTP_Called_MaxDelta": null,
        "RTP_Called_MinDelta": null,
        "RTP_Called_PacketTime": null,
        "RTP_Called_NonSilentPercentage": null,
        "RTP_Called_Delay": null,
        "RTP_Called_DSCP": null,
        "SDP_RTP_Called_Delay": null,
        "RTCP_RTT_Max": null,
        "RTCP_RTT_Mean": null,
        "RTCP_Caller_Jitter_Max": null,
        "RTCP_Caller_Jitter_Mean": null,
        "RTCP_Caller_LostPackets": null,
        "RTCP_Called_Jitter_Max": null,
        "RTCP_Called_Jitter_Mean": null,
        "RTCP_Called_LostPackets": null,
        "Test_ID": null,
        "RTP_Rx_PacketsTotal": null,
        "RTP_Rx_PacketsDiscarded": null,
        "RTP_Rx_PacketsDiscarded_Duplicated": null,
        "RTP_Rx_PacketsDiscarded_Early": null,
        "RTP_Rx_PacketsDiscarded_Late": null,
        "RTP_Rx_PacketsDiscarded_Error": null,
        "RTP_CodecSampleRate": null,
        "from_no": null,
        "to_no": null,
        "duration": null,
        "time_end": null,
        "created_at": null,
        "updated_at": null,
        "callerGroup": "Khối CNTT",
        "calledGroup": "Tổng công ty EVN SPC"
    }
];

// State quản lý bộ lọc, phân trang và modal
const QosState = {
    currentPage: 1,
    pageSize: 10,
    filteredRecords: [...QOS_CDR_DATASET],
    selectedCallId: null,
    isAdvancedFilterOpen: false
};

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    initQosUI();
    applyFilter();
    setupEventListeners();
});

/**
 * Khởi tạo giao diện và các bộ lắng nghe sự kiện
 */
function initQosUI() {
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    if (pageSizeSelect) {
        pageSizeSelect.value = String(QosState.pageSize);
    }
}

/**
 * Thiết lập các sự kiện tương tác
 */
function setupEventListeners() {
    // Form tìm kiếm
    const searchForm = document.getElementById('searchQosForm');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            QosState.currentPage = 1;
            applyFilter();
            showToastMessage('Đã cập nhật kết quả lọc QoS', 'info');
        });
    }

    // Toggle Bộ lọc nâng cao
    const toggleAdvBtn = document.getElementById('toggleAdvancedFilterBtn');
    if (toggleAdvBtn) {
        toggleAdvBtn.addEventListener('click', toggleAdvancedFilter);
    }

    // Nút Xóa bộ lọc
    const resetBtn = document.getElementById('resetFilterBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilter);
    }

    // Thay đổi số bản ghi mỗi trang
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', (e) => {
            QosState.pageSize = parseInt(e.target.value, 10);
            QosState.currentPage = 1;
            renderTableAndPagination();
        });
    }

    // Nút Làm mới
    const refreshBtn = document.getElementById('refreshQosBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            applyFilter();
            showToastMessage('Đã làm mới dữ liệu QoS từ tổng đài IP PABX', 'success');
        });
    }

    // Đóng Modal chi tiết khi click ngoài hoặc nút ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeQosDetailModal();
        }
    });

    const modalBackdrop = document.getElementById('qosDetailModal');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                closeQosDetailModal();
            }
        });
    }
}

/**
 * Bật/Tắt hiển thị Bộ lọc nâng cao (Slide Toggle)
 */
function toggleAdvancedFilter() {
    const advSection = document.getElementById('advancedFilterSection');
    const advText = document.getElementById('advancedFilterText');
    const toggleBtn = document.getElementById('toggleAdvancedFilterBtn');

    QosState.isAdvancedFilterOpen = !QosState.isAdvancedFilterOpen;

    if (advSection) {
        if (QosState.isAdvancedFilterOpen) {
            advSection.style.display = 'block';
            if (advText) advText.textContent = 'Ẩn bộ lọc nâng cao';
            if (toggleBtn) toggleBtn.classList.add('active');
        } else {
            advSection.style.display = 'none';
            if (advText) advText.textContent = 'Bộ lọc nâng cao';
            if (toggleBtn) toggleBtn.classList.remove('active');
        }
    }
}

/**
 * Đặt lại các trường lọc về mặc định
 */
function resetFilter() {
    const form = document.getElementById('searchQosForm');
    if (form) form.reset();

    // Reset date pickers to default period in SQL dump
    const fromEl = document.getElementById('filterFromDate');
    const toEl = document.getElementById('filterToDate');
    if (fromEl) fromEl.value = '2025-06-11';
    if (toEl) toEl.value = '2025-06-16';

    const statusEl = document.getElementById('filterStatus');
    if (statusEl) statusEl.value = 'ALL';

    const mosEl = document.getElementById('filterMos');
    if (mosEl) mosEl.value = 'ALL';

    const codeEl = document.getElementById('filterDisconnectionCode');
    if (codeEl) codeEl.value = 'ALL';

    const codecEl = document.getElementById('filterCodec');
    if (codecEl) codecEl.value = 'ALL';

    const lossEl = document.getElementById('filterPacketLoss');
    if (lossEl) lossEl.value = 'ALL';

    QosState.currentPage = 1;
    applyFilter();
    showToastMessage('Đã thiết lập lại toàn bộ bộ lọc', 'info');
}

/**
 * Áp dụng điều kiện lọc dữ liệu
 */
function applyFilter() {
    const fromDate = document.getElementById('filterFromDate')?.value;
    const toDate = document.getElementById('filterToDate')?.value;
    const callerId = document.getElementById('filterCallerId')?.value.trim().toLowerCase();
    const calledId = document.getElementById('filterCalledId')?.value.trim().toLowerCase();
    const status = document.getElementById('filterStatus')?.value || 'ALL';

    const mosThreshold = document.getElementById('filterMos')?.value || 'ALL';
    const sipCode = document.getElementById('filterDisconnectionCode')?.value || 'ALL';
    const codec = document.getElementById('filterCodec')?.value || 'ALL';
    const packetLoss = document.getElementById('filterPacketLoss')?.value || 'ALL';

    QosState.filteredRecords = QOS_CDR_DATASET.filter(row => {
        // 1. Khoảng thời gian
        if (fromDate && row.Created) {
            const rowDate = row.Created.substring(0, 10);
            if (rowDate < fromDate) return false;
        }
        if (toDate && row.Created) {
            const rowDate = row.Created.substring(0, 10);
            if (rowDate > toDate) return false;
        }

        // 2. Số gọi đi
        if (callerId) {
            const cId = String(row.CallerId || '').toLowerCase();
            const cName = String(row.CallerDisplayName || '').toLowerCase();
            if (!cId.includes(callerId) && !cName.includes(callerId)) return false;
        }

        // 3. Số nhận
        if (calledId) {
            const cdId = String(row.CalledId || '').toLowerCase();
            const cdName = String(row.CalledDisplayName || '').toLowerCase();
            if (!cdId.includes(calledId) && !cdName.includes(calledId)) return false;
        }

        // 4. Trạng thái cuộc gọi
        if (status !== 'ALL') {
            const discCode = String(row.DisconnectionCode || '');
            if (status === 'ANSWERED' && discCode !== '200') return false;
            if (status === 'BUSY' && discCode !== '486') return false;
            if (status === 'CANCEL' && discCode !== '487') return false;
            if (status === 'FAILED' && !['503', '408', '404', '603'].includes(discCode)) return false;
        }

        // 5. Ngưỡng MOS (lấy giá trị nhỏ hơn giữa Caller và Called)
        if (mosThreshold !== 'ALL') {
            const cMos = row.RTP_Caller_G107MOS !== null ? Number(row.RTP_Caller_G107MOS) : null;
            const cdMos = row.RTP_Called_G107MOS !== null ? Number(row.RTP_Called_G107MOS) : null;
            const minMos = Math.min(cMos !== null ? cMos : 5, cdMos !== null ? cdMos : 5);

            if (mosThreshold === 'POOR' && minMos >= 3.0) return false;
            if (mosThreshold === 'FAIR' && (minMos < 3.0 || minMos >= 4.0)) return false;
            if (mosThreshold === 'GOOD' && minMos < 4.0) return false;
        }

        // 6. Mã kết thúc SIP
        if (sipCode !== 'ALL') {
            if (String(row.DisconnectionCode || '') !== sipCode) return false;
        }

        // 7. Định dạng Codec
        if (codec !== 'ALL') {
            const rowCodec = String(row.RTP_Codec || '');
            if (!rowCodec.includes(codec)) return false;
        }

        // 8. Tỷ lệ mất gói tin
        if (packetLoss !== 'ALL') {
            const cLost = Number(row.RTP_Caller_LostPackets) || 0;
            const cdLost = Number(row.RTP_Called_LostPackets) || 0;
            const totalLost = cLost + cdLost;

            const cPackets = Number(row.RTP_Caller_PacketsCount) || 1;
            const cdPackets = Number(row.RTP_Called_PacketsCount) || 1;
            const maxPercent = Math.max((cLost / cPackets) * 100, (cdLost / cdPackets) * 100);

            if (packetLoss === 'ZERO' && totalLost > 0) return false;
            if (packetLoss === 'HAS_LOSS' && totalLost === 0) return false;
            if (packetLoss === 'HIGH_LOSS' && maxPercent <= 2.0) return false;
        }

        return true;
    });

    renderTableAndPagination();
}

/**
 * Hiển thị dữ liệu lên Bảng và điều khiển phân trang
 */
function renderTableAndPagination() {
    const tableBody = document.getElementById('qosTableBody');
    if (!tableBody) return;

    const total = QosState.filteredRecords.length;
    const totalPages = Math.ceil(total / QosState.pageSize) || 1;

    if (QosState.currentPage > totalPages) {
        QosState.currentPage = totalPages;
    }

    const startIndex = (QosState.currentPage - 1) * QosState.pageSize;
    const pageRecords = QosState.filteredRecords.slice(startIndex, startIndex + QosState.pageSize);

    if (pageRecords.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding: 40px 16px; color: var(--text-muted);">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 8px; opacity: 0.6;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <p style="font-size: 0.9375rem; margin: 0 0 4px; font-weight: 500;">Không tìm thấy bản ghi QoS phù hợp</p>
                    <small>Vui lòng thử điều chỉnh lại bộ lọc thời gian, số máy hoặc ngưỡng chất lượng</small>
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = pageRecords.map(record => renderTableRowHtml(record)).join('');
    }

    // Cập nhật thông tin phân trang
    renderPagination(total, totalPages, startIndex, pageRecords.length);
}

/**
 * Sinh mã HTML cho một dòng trong bảng dữ liệu (7 Cột cô đọng)
 */
function renderTableRowHtml(r) {
    const timeFormatted = formatDateTime(r.Created);
    const durationFormatted = formatDuration(r.Answered_Duration);

    const callerGroupBadge = r.callerGroup
        ? `<span class="badge-group" title="Đơn vị">${r.callerGroup}</span>`
        : '';
    const calledGroupBadge = r.calledGroup
        ? `<span class="badge-group" title="Đơn vị">${r.calledGroup}</span>`
        : '';

    const sipBadge = renderSipBadge(r.DisconnectionCode, r.DisconnectionStatus);

    const qosMetricHtml = renderCombinedQosCell(r);

    const codecBadge = r.RTP_Codec
        ? `<span class="codec-badge">${r.RTP_Codec}</span>`
        : '<span style="color:var(--text-muted); font-size:0.8rem;">-</span>';

    return `
        <tr onclick="openQosDetailModal(${r.id})" style="cursor: pointer;">
            <td>
                <div class="datetime-cell">
                    <span class="date">${timeFormatted.date}</span>
                    <span class="time">${timeFormatted.time}</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                    ${durationFormatted ? '⏱ ' + durationFormatted : '<span style="color:#94a3b8;">Không đàm thoại</span>'}
                </div>
            </td>
            <td>
                <div class="phone-number text-primary" style="font-weight: 600;">${r.CallerId || 'Ẩn danh'}</div>
                ${r.CallerDisplayName ? `<div style="font-size:0.75rem; color:var(--text-muted);">${r.CallerDisplayName}</div>` : ''}
                ${callerGroupBadge}
            </td>
            <td>
                <div class="phone-number" style="font-weight: 600;">${r.CalledId || '-'}</div>
                ${r.CalledDisplayName ? `<div style="font-size:0.75rem; color:var(--text-muted);">${r.CalledDisplayName}</div>` : ''}
                ${calledGroupBadge}
            </td>
            <td style="text-align: center;">
                ${sipBadge}
            </td>
            <td>
                ${qosMetricHtml}
            </td>
            <td style="text-align: center;">
                ${codecBadge}
            </td>
            <td style="text-align: center;" onclick="event.stopPropagation();">
                <button type="button" class="btn btn-sm btn-outline" onclick="openQosDetailModal(${r.id})" title="Xem chi tiết thông số QoS & SIP">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    Chi tiết
                </button>
            </td>
        </tr>
    `;
}

/**
 * Hiển thị khối Chất lượng thoại 2 chiều cô đọng (MOS | Loss | Jitter)
 */
function renderCombinedQosCell(r) {
    if (!r.RTP_Codec && r.RTP_Caller_G107MOS === null && r.RTP_Called_G107MOS === null) {
        return `
            <div style="text-align: center; color: var(--text-muted); font-size: 0.8125rem;">
                <em>Chưa thiết lập luồng RTP</em>
            </div>
        `;
    }

    // Caller Metrics
    const cMos = r.RTP_Caller_G107MOS !== null ? Number(r.RTP_Caller_G107MOS).toFixed(1) : '-';
    const cPackets = Number(r.RTP_Caller_PacketsCount) || 0;
    const cLost = Number(r.RTP_Caller_LostPackets) || 0;
    const cLossPercent = cPackets > 0 ? ((cLost / cPackets) * 100).toFixed(1) + '%' : '0%';
    const cJitter = r.RTP_Caller_MeanRfc3550Jitter !== null ? Math.round(Number(r.RTP_Caller_MeanRfc3550Jitter)) + 'ms' : '-';

    const cMosClass = getMosBadgeClass(r.RTP_Caller_G107MOS);
    const cLossClass = getLossBadgeClass(cLossPercent);

    // Called Metrics
    const cdMos = r.RTP_Called_G107MOS !== null ? Number(r.RTP_Called_G107MOS).toFixed(1) : '-';
    const cdPackets = Number(r.RTP_Called_PacketsCount) || 0;
    const cdLost = Number(r.RTP_Called_LostPackets) || 0;
    const cdLossPercent = cdPackets > 0 ? ((cdLost / cdPackets) * 100).toFixed(1) + '%' : '0%';
    const cdJitter = r.RTP_Called_MeanRfc3550Jitter !== null ? Math.round(Number(r.RTP_Called_MeanRfc3550Jitter)) + 'ms' : '-';

    const cdMosClass = getMosBadgeClass(r.RTP_Called_G107MOS);
    const cdLossClass = getLossBadgeClass(cdLossPercent);

    return `
        <div class="qos-combined-cell">
            <div class="qos-row">
                <span class="qos-dir-tag">Gọi (TX):</span>
                <span class="qos-val ${cMosClass}">MOS ${cMos}</span>
                <span class="qos-sep">&bull;</span>
                <span class="qos-val ${cLossClass}">Mất: ${cLossPercent}</span>
                <span class="qos-sep">&bull;</span>
                <span class="qos-val">Jitter: ${cJitter}</span>
            </div>
            <div class="qos-row">
                <span class="qos-dir-tag">Nhận (RX):</span>
                <span class="qos-val ${cdMosClass}">MOS ${cdMos}</span>
                <span class="qos-sep">&bull;</span>
                <span class="qos-val ${cdLossClass}">Mất: ${cdLossPercent}</span>
                <span class="qos-sep">&bull;</span>
                <span class="qos-val">Jitter: ${cdJitter}</span>
            </div>
        </div>
    `;
}

/**
 * Hiển thị Badge mã kết thúc SIP
 */
function renderSipBadge(code, status) {
    const sCode = String(code || '');
    let badgeClass = 'badge-sip-other';
    let label = status || sCode || 'N/A';

    if (sCode === '200') {
        badgeClass = 'badge-sip-200';
        label = '200 OK';
    } else if (sCode === '486') {
        badgeClass = 'badge-sip-486';
        label = '486 Busy';
    } else if (sCode === '487') {
        badgeClass = 'badge-sip-487';
        label = '487 Cancelled';
    } else if (sCode === '503') {
        badgeClass = 'badge-sip-503';
        label = '503 Error';
    } else if (sCode === '408') {
        badgeClass = 'badge-sip-408';
        label = '408 Timeout';
    }

    return `<span class="badge-sip ${badgeClass}" title="${sCode} - ${status || ''}">${label}</span>`;
}

/**
 * Điều khiển thanh phân trang
 */
function renderPagination(total, totalPages, startIndex, pageCount) {
    const summaryEl = document.getElementById('paginationSummary');
    if (summaryEl) {
        if (total === 0) {
            summaryEl.textContent = 'bản ghi mỗi trang (Tổng: 0)';
        } else {
            summaryEl.textContent = `bản ghi mỗi trang (Hiển thị ${startIndex + 1} - ${startIndex + pageCount} / Tổng: ${total})`;
        }
    }

    const controls = document.getElementById('paginationControls');
    if (!controls) return;

    if (totalPages <= 1) {
        controls.innerHTML = '';
        return;
    }

    let html = '';
    // Nút Trước
    const prevDisabled = QosState.currentPage === 1 ? 'disabled' : '';
    html += `<li class="page-item ${prevDisabled}"><a href="#" class="page-link" onclick="changePage(${QosState.currentPage - 1}); return false;">&laquo;</a></li>`;

    for (let p = 1; p <= totalPages; p++) {
        const activeClass = p === QosState.currentPage ? 'active' : '';
        html += `<li class="page-item ${activeClass}"><a href="#" class="page-link" onclick="changePage(${p}); return false;">${p}</a></li>`;
    }

    // Nút Sau
    const nextDisabled = QosState.currentPage === totalPages ? 'disabled' : '';
    html += `<li class="page-item ${nextDisabled}"><a href="#" class="page-link" onclick="changePage(${QosState.currentPage + 1}); return false;">&raquo;</a></li>`;

    controls.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(QosState.filteredRecords.length / QosState.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    QosState.currentPage = page;
    renderTableAndPagination();
}

/**
 * Mở Modal Chi tiết 4 Khối Cards cho một cuộc gọi cụ thể
 */
function openQosDetailModal(callId) {
    const record = QOS_CDR_DATASET.find(r => r.id === callId);
    if (!record) return;

    QosState.selectedCallId = callId;

    // 1. Header Modal
    document.getElementById('modalCallIdTitle').textContent = `Chi tiết Kỹ thuật QoS Cuộc gọi #${String(record.id).padStart(8, '0')}`;
    document.getElementById('modalSipCallIdBadge').textContent = record.SipCallId || 'N/A';

    // 2. KHỐI 1: Thông tin Tổng quan
    document.getElementById('mCallCreated').textContent = record.Created || '-';
    document.getElementById('mCallAnswered').textContent = record.Answered || 'Không nhấc máy';
    document.getElementById('mCallDestroyed').textContent = record.Destroyed || '-';
    document.getElementById('mCallDuration').textContent = formatDuration(record.Answered_Duration) || '00:00';
    document.getElementById('mCallCaller').textContent = `${record.CallerId || 'Ẩn danh'} (${record.CallerDisplayName || 'N/A'})`;
    document.getElementById('mCallCalled').textContent = `${record.CalledId || '-'} (${record.CalledDisplayName || 'N/A'})`;
    document.getElementById('mCallDirection').textContent = record.Direction || 'remote';
    document.getElementById('mCallReleasedBy').textContent = record.ReleasedBy ? `Bên ngắt: ${record.ReleasedBy}` : 'N/A';

    // 3. KHỐI 2: Báo hiệu SIP & Độ trễ Mạng
    document.getElementById('mSipDisconnCode').innerHTML = renderSipBadge(record.DisconnectionCode, record.DisconnectionStatus);
    document.getElementById('mSipAnswerDelay').textContent = record.Answer_Delay !== null ? `${record.Answer_Delay} ms` : 'N/A';
    document.getElementById('mSip100Delay').textContent = record._100_Delay !== null ? `${record._100_Delay} ms` : 'Không ghi nhận';
    document.getElementById('mSip180Delay').textContent = record._180_Delay !== null ? `${record._180_Delay} ms` : 'Không ghi nhận';
    document.getElementById('mSip183Delay').textContent = record._183_Delay !== null ? `${record._183_Delay} ms` : 'Không ghi nhận';
    document.getElementById('mSipAudioDelay').textContent = record.Audio_Signal_Delay !== null ? `${record.Audio_Signal_Delay} ms` : 'N/A';

    // 4. KHỐI 3: Chất lượng Thoại RTP ITU-T G.107 (Đối chiếu 2 chiều)
    renderModalRtpComparison(record);

    // 5. KHỐI 4: Hạ tầng Mạng IP & DSCP (Layer 3 QoS)
    document.getElementById('mCallerSignalingIp').textContent = record.CallerIp || 'N/A';
    document.getElementById('mCalledSignalingIp').textContent = record.CalledIp || 'N/A';
    document.getElementById('mCallerRtpEndpoint').textContent = record.RTP_Caller_Address ? `${record.RTP_Caller_Address}:${record.RTP_Caller_Port}` : 'N/A';
    document.getElementById('mCalledRtpEndpoint').textContent = record.RTP_Called_Address ? `${record.RTP_Called_Address}:${record.RTP_Called_Port}` : 'N/A';
    document.getElementById('mCallerDscp').innerHTML = formatDscp(record.RTP_Caller_DSCP);
    document.getElementById('mCalledDscp').innerHTML = formatDscp(record.RTP_Called_DSCP);
    document.getElementById('mRtpCodecName').textContent = record.RTP_Codec || 'N/A';
    document.getElementById('mRtpSampleRate').textContent = record.RTP_CodecSampleRate ? `${record.RTP_CodecSampleRate} Hz` : '8000 Hz';
    document.getElementById('mCallerSsrc').textContent = record.RTP_Caller_SSRC || 'N/A';
    document.getElementById('mCalledSsrc').textContent = record.RTP_Called_SSRC || 'N/A';

    // Mở modal
    const modalEl = document.getElementById('qosDetailModal');
    if (modalEl) {
        modalEl.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Điền bảng so sánh 2 chiều RTP vào Khối 3 của Modal
 */
function renderModalRtpComparison(r) {
    const cPackets = Number(r.RTP_Caller_PacketsCount) || 0;
    const cLost = Number(r.RTP_Caller_LostPackets) || 0;
    const cLossPct = cPackets > 0 ? ((cLost / cPackets) * 100).toFixed(2) + '%' : '0.00%';

    const cdPackets = Number(r.RTP_Called_PacketsCount) || 0;
    const cdLost = Number(r.RTP_Called_LostPackets) || 0;
    const cdLossPct = cdPackets > 0 ? ((cdLost / cdPackets) * 100).toFixed(2) + '%' : '0.00%';

    document.getElementById('mCallerMos').textContent = r.RTP_Caller_G107MOS !== null ? Number(r.RTP_Caller_G107MOS).toFixed(1) : '-';
    document.getElementById('mCalledMos').textContent = r.RTP_Called_G107MOS !== null ? Number(r.RTP_Called_G107MOS).toFixed(1) : '-';

    document.getElementById('mCallerR').textContent = r.RTP_Caller_G107R !== null ? r.RTP_Caller_G107R : '-';
    document.getElementById('mCalledR').textContent = r.RTP_Called_G107R !== null ? r.RTP_Called_G107R : '-';

    document.getElementById('mCallerPackets').textContent = `${cPackets.toLocaleString()} gói`;
    document.getElementById('mCalledPackets').textContent = `${cdPackets.toLocaleString()} gói`;

    document.getElementById('mCallerLoss').innerHTML = `<span class="${getLossBadgeClass(cLossPct)}">${cLost} gói (${cLossPct})</span>`;
    document.getElementById('mCalledLoss').innerHTML = `<span class="${getLossBadgeClass(cdLossPct)}">${cdLost} gói (${cdLossPct})</span>`;

    document.getElementById('mCallerJitterMean').textContent = r.RTP_Caller_MeanRfc3550Jitter !== null ? `${Number(r.RTP_Caller_MeanRfc3550Jitter).toFixed(2)} ms` : '-';
    document.getElementById('mCalledJitterMean').textContent = r.RTP_Called_MeanRfc3550Jitter !== null ? `${Number(r.RTP_Called_MeanRfc3550Jitter).toFixed(2)} ms` : '-';

    document.getElementById('mCallerJitterMax').textContent = r.RTP_Caller_MaxRfc3550Jitter !== null ? `${Number(r.RTP_Caller_MaxRfc3550Jitter).toFixed(2)} ms` : '-';
    document.getElementById('mCalledJitterMax').textContent = r.RTP_Called_MaxRfc3550Jitter !== null ? `${Number(r.RTP_Called_MaxRfc3550Jitter).toFixed(2)} ms` : '-';

    document.getElementById('mCallerDelta').textContent = r.RTP_Caller_MaxDelta !== null ? `Min: ${r.RTP_Caller_MinDelta}ms / Max: ${r.RTP_Caller_MaxDelta}ms` : '-';
    document.getElementById('mCalledDelta').textContent = r.RTP_Called_MaxDelta !== null ? `Min: ${r.RTP_Called_MinDelta}ms / Max: ${r.RTP_Called_MaxDelta}ms` : '-';

    document.getElementById('mCallerPktTime').textContent = r.RTP_Caller_PacketTime ? `${r.RTP_Caller_PacketTime} ms` : '20 ms';
    document.getElementById('mCalledPktTime').textContent = r.RTP_Called_PacketTime ? `${r.RTP_Called_PacketTime} ms` : '20 ms';
}

function closeQosDetailModal() {
    const modalEl = document.getElementById('qosDetailModal');
    if (modalEl) {
        modalEl.style.display = 'none';
        document.body.style.overflow = '';
    }
    QosState.selectedCallId = null;
}

// Helpers
function formatDateTime(str) {
    if (!str) return { date: '-', time: '-' };
    const parts = str.split(' ');
    const d = parts[0] || '';
    const t = parts[1] || '';
    const dParts = d.split('-');
    const dateFormatted = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : d;
    return { date: dateFormatted, time: t };
}

function formatDuration(seconds) {
    if (seconds === null || seconds === undefined) return null;
    const totalSec = Math.round(Number(seconds));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getMosBadgeClass(val) {
    if (val === null || val === undefined) return '';
    const v = Number(val);
    if (v >= 4.0) return 'mos-good';
    if (v >= 3.0) return 'mos-warning';
    return 'mos-poor';
}

function getLossBadgeClass(pctStr) {
    const v = parseFloat(pctStr) || 0;
    if (v === 0) return 'loss-good';
    if (v <= 2.0) return 'loss-warning';
    return 'loss-poor';
}

function formatDscp(val) {
    if (val === null || val === undefined) return 'N/A';
    const v = Number(val);
    if (v === 46) return `<strong>${v}</strong> <span style="font-size:0.75rem; color:#10b981;">(EF - Expedited Forwarding)</span>`;
    if (v === 48) return `<strong>${v}</strong> <span style="font-size:0.75rem; color:#0284c7;">(CS6 - Network Control)</span>`;
    if (v === 1) return `<strong>${v}</strong> <span style="font-size:0.75rem; color:#f59e0b;">(CS1 - Scavenger)</span>`;
    return `<strong>${v}</strong>`;
}

function showToastMessage(msg, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(msg, type);
    } else {
        const toast = document.createElement('div');
        toast.className = `admin-toast ${type}`;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}
